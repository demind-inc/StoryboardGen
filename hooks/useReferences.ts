import { useState, useRef } from "react";
import { ReferenceImage, ReferenceSet } from "../types";
import {
  useSaveReferenceImages,
  useUpdateReferenceSetLabel,
} from "./useLibraryService";

interface UseReferencesReturn {
  references: ReferenceImage[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isSavingReferences: boolean;
  setReferences: React.Dispatch<React.SetStateAction<ReferenceImage[]>>;
  triggerUpload: () => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeReference: (id: string) => void;
  handleSaveReferences: (label?: string) => Promise<void>;
  handleAddReferencesFromLibrary: (sets: ReferenceSet[]) => Promise<void>;
  handleUpdateReferenceSetLabel: (
    setId: string,
    label: string,
    setReferenceLibrary?: React.Dispatch<React.SetStateAction<ReferenceSet[]>>
  ) => Promise<void>;
  refreshReferenceLibrary: (userId: string) => Promise<void>;
}

export const useReferences = (
  userId: string | undefined,
  refreshReferenceLibrary: (userId: string) => Promise<void>
): UseReferencesReturn => {
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveReferencesMutation = useSaveReferenceImages();
  const updateReferenceSetLabelMutation = useUpdateReferenceSetLabel();
  const isSavingReferences = saveReferencesMutation.isPending;

  const triggerUpload = () => fileInputRef.current?.click();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferences((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            data: reader.result as string,
            mimeType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReference = (id: string) => {
    setReferences((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveReferences = async (label?: string) => {
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }

    const refsWithData = references.filter((r) => r.data);
    if (refsWithData.length === 0) {
      alert("Upload a reference image first.");
      return;
    }

    try {
      await saveReferencesMutation.mutateAsync({
        userId,
        references: refsWithData,
        label,
      });
    } catch (error) {
      console.error("Failed to save references:", error);
      alert("Could not save references. Please try again.");
    }
  };

  const handleAddReferencesFromLibrary = async (sets: ReferenceSet[]) => {
    if (!sets.length) return;
    const allImages = sets.flatMap((set) => set.images);

    // Add placeholders immediately so the grid updates and shows loading slots
    const placeholders: ReferenceImage[] = allImages.map((item) => ({
      id: item.id,
      data: "",
      mimeType: item.mimeType,
      url: item.url,
    }));
    setReferences((prev) => [...prev, ...placeholders]);

    // Load each image in parallel and update that slot when ready (stream in)
    const loadOne = async (item: (typeof allImages)[0]): Promise<void> => {
      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        setReferences((prev) =>
          prev.map((r) =>
            r.id === item.id ? { ...r, data, url: undefined } : r
          )
        );
      } catch (error) {
        console.error("Failed to load image from storage:", error);
        setReferences((prev) => prev.filter((r) => r.id !== item.id));
      }
    };
    allImages.forEach((item) => void loadOne(item));
  };

  const handleUpdateReferenceSetLabel = async (
    setId: string,
    label: string,
    setReferenceLibrary?: React.Dispatch<React.SetStateAction<ReferenceSet[]>>
  ) => {
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }

    const trimmedLabel = label.trim();

    if (!trimmedLabel) {
      alert("Please provide a name for this reference set.");
      return;
    }

    try {
      await updateReferenceSetLabelMutation.mutateAsync({
        userId,
        setId,
        label: trimmedLabel,
      });
      if (setReferenceLibrary) {
        setReferenceLibrary((prev) =>
          prev.map((set) =>
            set.setId === setId
              ? {
                  ...set,
                  label: trimmedLabel,
                  images: set.images.map((img) => ({
                    ...img,
                    label: trimmedLabel,
                  })),
                }
              : set
          )
        );
      }
    } catch (error) {
      console.error("Failed to update reference set label:", error);
      alert("Could not update reference set. Please try again.");
      throw error;
    }
  };

  return {
    references,
    fileInputRef,
    isSavingReferences,
    setReferences,
    triggerUpload,
    handleFileUpload,
    removeReference,
    handleSaveReferences,
    handleAddReferencesFromLibrary,
    handleUpdateReferenceSetLabel,
    refreshReferenceLibrary,
  };
};
