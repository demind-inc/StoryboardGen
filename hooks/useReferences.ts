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

    if (references.length === 0) {
      alert("Upload a reference image first.");
      return;
    }

    try {
      await saveReferencesMutation.mutateAsync({
        userId,
        references,
        label,
      });
    } catch (error) {
      console.error("Failed to save references:", error);
      alert("Could not save references. Please try again.");
    }
  };

  const handleAddReferencesFromLibrary = async (sets: ReferenceSet[]) => {
    if (!sets.length) return;
    // Flatten all images from selected sets
    const allImages = sets.flatMap((set) => set.images);

    // Convert URLs to base64 data URLs for ReferenceImage (needed for Gemini API)
    const mapped = await Promise.all(
      allImages.map(async (item): Promise<ReferenceImage> => {
        try {
          const response = await fetch(item.url);
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                id: Math.random().toString(36).substring(2, 9),
                data: reader.result as string,
                mimeType: item.mimeType,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error("Failed to load image from storage:", error);
          throw error;
        }
      })
    );

    setReferences((prev) => [...prev, ...mapped]);
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
