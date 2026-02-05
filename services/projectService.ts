import { getSupabaseClient } from "./supabaseClient";
import type { ProjectDetail, ProjectSummary, SceneResult } from "../types";

const OUTPUT_BUCKET = "project-outputs";

const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const getFileExtension = (mimeType: string) => {
  const parts = mimeType.split("/");
  return parts[1] || "png";
};

export async function saveProjectWithOutputs(params: {
  userId: string;
  projectId?: string | null;
  projectName: string;
  prompts: string[];
  captions: { tiktok: string[]; instagram: string[] };
  results: SceneResult[];
}): Promise<string> {
  const { userId, projectId, projectName, prompts, captions, results } = params;
  const supabase = getSupabaseClient();

  let finalProjectId = projectId || null;

  if (finalProjectId) {
    const { error } = await (supabase.from("projects") as any)
      .update({
        name: projectName,
        prompts,
        tiktok_captions: captions.tiktok,
        instagram_captions: captions.instagram,
        updated_at: new Date().toISOString(),
      })
      .eq("id", finalProjectId)
      .eq("user_id", userId);
    if (error) throw error;
  } else {
    const { data, error } = await (supabase.from("projects") as any)
      .insert({
        user_id: userId,
        name: projectName,
        prompts,
        tiktok_captions: captions.tiktok,
        instagram_captions: captions.instagram,
      })
      .select("id")
      .single();
    if (error) throw error;
    if (!data?.id) {
      throw new Error("Failed to create project");
    }
    finalProjectId = data.id;
  }

  if (!finalProjectId) {
    throw new Error("Project id missing");
  }

  const outputPayload: any[] = [];
  for (let i = 0; i < results.length; i++) {
    const scene = results[i];
    if (!scene.imageUrl) continue;
    const blob = dataURLtoBlob(scene.imageUrl);
    const mimeType = blob.type || "image/png";
    const ext = getFileExtension(mimeType);
    const filePath = `${userId}/${finalProjectId}/${i}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(OUTPUT_BUCKET)
      .upload(filePath, blob, {
        contentType: mimeType,
        upsert: true,
      });
    if (uploadError) throw uploadError;

    outputPayload.push({
      project_id: finalProjectId,
      scene_index: i,
      prompt: scene.prompt,
      title: scene.title ?? null,
      description: scene.description ?? null,
      file_path: filePath,
      mime_type: mimeType,
    });
  }

  const { error: deleteError } = await supabase
    .from("project_outputs")
    .delete()
    .eq("project_id", finalProjectId);
  if (deleteError) throw deleteError;

  if (outputPayload.length) {
    const { error: insertError } = await supabase
      .from("project_outputs")
      .insert(outputPayload as any);
    if (insertError) throw insertError;
  }

  return finalProjectId;
}

export async function saveProjectOutput(params: {
  userId: string;
  projectId: string;
  sceneIndex: number;
  prompt: string;
  imageUrl: string;
  title?: string;
  description?: string;
  captions?: { tiktok?: string; instagram?: string };
}): Promise<void> {
  const {
    userId,
    projectId,
    sceneIndex,
    prompt,
    imageUrl,
    title,
    description,
    captions,
  } = params;
  const supabase = getSupabaseClient();

  const blob = dataURLtoBlob(imageUrl);
  const mimeType = blob.type || "image/png";
  const ext = getFileExtension(mimeType);
  const filePath = `${userId}/${projectId}/${sceneIndex}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(OUTPUT_BUCKET)
    .upload(filePath, blob, {
      contentType: mimeType,
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { error: upsertError } = await supabase.from("project_outputs").upsert(
    {
      project_id: projectId,
      scene_index: sceneIndex,
      prompt,
      title: title ?? null,
      description: description ?? null,
      file_path: filePath,
      mime_type: mimeType,
    } as any,
    { onConflict: "project_id,scene_index" }
  );
  if (upsertError) throw upsertError;

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (captions && (captions.tiktok !== undefined || captions.instagram !== undefined)) {
    const { data: projectData, error: projectFetchError } = await (
      supabase.from("projects") as any
    )
      .select("tiktok_captions, instagram_captions")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();
    if (projectFetchError) throw projectFetchError;

    if (captions.tiktok !== undefined) {
      const nextTiktok = Array.isArray(projectData?.tiktok_captions)
        ? [...projectData.tiktok_captions]
        : [];
      while (nextTiktok.length <= sceneIndex) nextTiktok.push("");
      nextTiktok[sceneIndex] = captions.tiktok;
      updatePayload.tiktok_captions = nextTiktok;
    }

    if (captions.instagram !== undefined) {
      const nextInstagram = Array.isArray(projectData?.instagram_captions)
        ? [...projectData.instagram_captions]
        : [];
      while (nextInstagram.length <= sceneIndex) nextInstagram.push("");
      nextInstagram[sceneIndex] = captions.instagram;
      updatePayload.instagram_captions = nextInstagram;
    }
  }

  const { error: projectError } = await (supabase.from("projects") as any)
    .update(updatePayload)
    .eq("id", projectId)
    .eq("user_id", userId);
  if (projectError) throw projectError;
}

export async function fetchProjectList(
  userId: string
): Promise<ProjectSummary[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, prompts, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (
    (data as any[])?.map((row) => ({
      id: row.id,
      name: row.name,
      prompts: row.prompts ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) ?? []
  );
}

export async function fetchProjectDetail(params: {
  userId: string;
  projectId: string;
}): Promise<ProjectDetail> {
  const { userId, projectId } = params;
  const supabase = getSupabaseClient();

  const { data: project, error: projectError } = await (
    supabase.from("projects") as any
  )
    .select(
      "id, name, prompts, tiktok_captions, instagram_captions, created_at, updated_at"
    )
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();
  if (projectError) throw projectError;

  const { data: outputs, error: outputsError } = await supabase
    .from("project_outputs")
    .select(
      "id, scene_index, prompt, title, description, file_path, mime_type, created_at"
    )
    .eq("project_id", projectId)
    .order("scene_index", { ascending: true });
  if (outputsError) throw outputsError;

  const signedUrlResults = await Promise.all(
    (outputs as any[]).map(async (item) => {
      const { data: signedData, error: urlError } = await supabase.storage
        .from(OUTPUT_BUCKET)
        .createSignedUrl(item.file_path, 3600);
      if (urlError) {
        console.error("Failed to create signed URL:", urlError);
      }
      return {
        ...item,
        signedUrl: signedData?.signedUrl || "",
      };
    })
  );

  return {
    id: project.id,
    name: project.name,
    prompts: project.prompts ?? [],
    captions: {
      tiktok: project.tiktok_captions ?? [],
      instagram: project.instagram_captions ?? [],
    },
    outputs: signedUrlResults.map((item) => ({
      id: item.id,
      sceneIndex: item.scene_index,
      prompt: item.prompt,
      title: item.title ?? undefined,
      description: item.description ?? undefined,
      imageUrl: item.signedUrl,
      mimeType: item.mime_type,
      createdAt: item.created_at,
    })),
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}
