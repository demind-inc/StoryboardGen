import React from "react";
import { SceneResult } from "../../types";
import Results from "../Results/Results";

export interface ResultsCardProps {
  results: SceneResult[];
  isGenerating: boolean;
  onRegenerateResult: (index: number) => void;
  onRegenerateAll: () => void;
  captions: { tiktok: string; instagram: string };
  onGenerateCaption?: (
    platform: "tiktok" | "instagram",
    options: { rules: string; hashtags: string[] }
  ) => Promise<void> | void;
  projectName: string;
  allowRegenerate?: boolean;
  onBack?: () => void;
}

const ResultsCard: React.FC<ResultsCardProps> = ({
  results,
  isGenerating,
  onRegenerateResult,
  onRegenerateAll,
  captions,
  onGenerateCaption,
  projectName,
  allowRegenerate,
  onBack,
}) => {
  const handleDownloadAll = async () => {
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const hasImages = results.some((result) => result.imageUrl);
      if (!hasImages) return;

      await Promise.all(
        results.map(async (result, idx) => {
          if (!result.imageUrl) return;
          const response = await fetch(result.imageUrl);
          const blob = await response.blob();
          const extension =
            blob.type.split("/")[1] ||
            result.imageUrl.split(".").pop() ||
            "png";
          const fileName = `scene-${idx + 1}.${extension}`;
          zip.file(fileName, blob);
        })
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = `${projectName || "project"}-outputs.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(zipUrl);
    } catch (error) {
      console.error("Failed to download zip:", error);
    }
  };

  return (
    <Results
      mode="manual"
      results={results}
      isGenerating={isGenerating}
      onRegenerate={onRegenerateResult}
      onRegenerateAll={onRegenerateAll}
      onDownloadAll={handleDownloadAll}
      captions={captions}
      onGenerateCaption={onGenerateCaption}
      projectName={projectName}
      allowRegenerate={allowRegenerate}
      onBack={onBack}
    />
  );
};

export default ResultsCard;
