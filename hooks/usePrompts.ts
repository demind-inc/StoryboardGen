import { useState } from "react";
import { PromptPreset } from "../types";
import {
  savePromptPreset,
  updatePromptPreset,
} from "../services/libraryService";

interface UsePromptsReturn {
  manualPrompts: string;
  isAddingNewPrompt: boolean;
  editingPromptIndex: number | null;
  savingPromptIndex: number | null;
  setManualPrompts: React.Dispatch<React.SetStateAction<string>>;
  handleAddPrompt: () => void;
  handleRemovePrompt: (index: number) => void;
  handleReorderPrompt: (fromIndex: number, toIndex: number) => void;
  handleStartEditPrompt: (index: number) => void;
  handleSavePrompt: (index: number | null, value: string) => void;
  handleCancelEdit: () => void;
  handleSaveIndividualPrompt: (index: number) => Promise<void>;
  handleSavePromptPreset: (title?: string) => Promise<void>;
  handleUpdatePromptPreset: (
    presetId: string,
    title: string,
    content: string
  ) => Promise<void>;
  handleUsePromptPreset: (preset: PromptPreset) => void;
  setPromptLibrary: React.Dispatch<React.SetStateAction<PromptPreset[]>>;
}

export const usePrompts = (
  userId: string | undefined,
  setPromptLibrary: React.Dispatch<React.SetStateAction<PromptPreset[]>>
): UsePromptsReturn => {
  const [manualPrompts, setManualPrompts] = useState<string>(
    "Boy looking confused with question marks around him\nBoy feeling lonely at a cafe table\nBoy looking angry while listening to something"
  );
  const [isAddingNewPrompt, setIsAddingNewPrompt] = useState(false);
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(
    null
  );
  const [savingPromptIndex, setSavingPromptIndex] = useState<number | null>(
    null
  );

  const handleAddPrompt = () => {
    setIsAddingNewPrompt(true);
  };

  const handleRemovePrompt = (index: number) => {
    const promptList = manualPrompts.split("\n").filter((p) => p.trim() !== "");
    promptList.splice(index, 1);
    setManualPrompts(promptList.join("\n"));
  };

  const handleReorderPrompt = (fromIndex: number, toIndex: number) => {
    const promptList = manualPrompts.split("\n").filter((p) => p.trim() !== "");
    if (
      fromIndex < 0 ||
      fromIndex >= promptList.length ||
      toIndex < 0 ||
      toIndex >= promptList.length
    ) {
      return;
    }
    const [moved] = promptList.splice(fromIndex, 1);
    promptList.splice(toIndex, 0, moved);
    setManualPrompts(promptList.join("\n"));
    setEditingPromptIndex(null);
  };

  const handleStartEditPrompt = (index: number) => {
    setEditingPromptIndex(index);
  };

  const handleSavePrompt = (index: number | null, value: string) => {
    if (value.trim()) {
      if (index !== null) {
        // Editing existing prompt
        const promptList = manualPrompts
          .split("\n")
          .filter((p) => p.trim() !== "");
        promptList[index] = value.trim();
        setManualPrompts(promptList.join("\n"));
        setEditingPromptIndex(null);
      } else {
        // Adding new prompt
        const trimmedPrompts = manualPrompts.trim();
        const newPrompts = trimmedPrompts
          ? `${trimmedPrompts}\n${value.trim()}`
          : value.trim();
        setManualPrompts(newPrompts);
        setIsAddingNewPrompt(false);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingPromptIndex(null);
    setIsAddingNewPrompt(false);
  };

  const handleSaveIndividualPrompt = async (index: number) => {
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }

    const promptList = manualPrompts.split("\n").filter((p) => p.trim() !== "");
    const promptText = promptList[index]?.trim();

    if (!promptText) {
      alert("Please select a valid prompt to save.");
      return;
    }

    setSavingPromptIndex(index);
    try {
      const saved = await savePromptPreset(userId, promptText, promptText);
      setPromptLibrary((prev) => [saved, ...prev]);
    } catch (error) {
      console.error("Failed to save prompt:", error);
      alert("Could not save prompt. Please try again.");
    } finally {
      setSavingPromptIndex(null);
    }
  };

  const handleSavePromptPreset = async (title?: string) => {
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }

    const content = manualPrompts.trim();

    if (!content) {
      alert("Please add a prompt before saving.");
      return;
    }

    try {
      const saved = await savePromptPreset(userId, content, title);
      setPromptLibrary((prev) => [saved, ...prev]);
    } catch (error) {
      console.error("Failed to save prompt preset:", error);
      alert("Could not save prompt preset. Please try again.");
    }
  };

  const handleUpdatePromptPreset = async (
    presetId: string,
    title: string,
    content: string
  ) => {
    if (!userId) {
      alert("Unable to verify your account. Please sign in again.");
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      alert("Please provide both a title and prompt content.");
      return;
    }

    try {
      const updated = await updatePromptPreset(
        userId,
        presetId,
        trimmedTitle,
        trimmedContent
      );
      setPromptLibrary((prev) =>
        prev.map((prompt) => (prompt.id === presetId ? updated : prompt))
      );
    } catch (error) {
      console.error("Failed to update prompt preset:", error);
      alert("Could not update prompt preset. Please try again.");
    }
  };

  const handleUsePromptPreset = (preset: PromptPreset) => {
    // Add the single prompt to the list instead of replacing
    const trimmedPrompts = manualPrompts.trim();
    const newPrompts = trimmedPrompts
      ? `${trimmedPrompts}\n${preset.content.trim()}`
      : preset.content.trim();
    setManualPrompts(newPrompts);
  };

  return {
    manualPrompts,
    isAddingNewPrompt,
    editingPromptIndex,
    savingPromptIndex,
    setManualPrompts,
    handleAddPrompt,
    handleRemovePrompt,
    handleReorderPrompt,
    handleStartEditPrompt,
    handleSavePrompt,
    handleCancelEdit,
    handleSaveIndividualPrompt,
    handleSavePromptPreset,
    handleUpdatePromptPreset,
    handleUsePromptPreset,
    setPromptLibrary,
  };
};
