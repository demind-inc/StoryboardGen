import { useState } from "react";

interface NameModalState {
  type: "reference" | "prompt" | null;
  defaultValue: string;
}

interface UseModalsReturn {
  isReferenceLibraryOpen: boolean;
  isPromptLibraryOpen: boolean;
  isPaymentModalOpen: boolean;
  nameModal: NameModalState;
  setIsReferenceLibraryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPromptLibraryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPaymentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openReferenceNameModal: () => void;
  openPromptNameModal: () => void;
  closeNameModal: () => void;
  handleNameModalSave: (
    value: string,
    onSaveReference?: (label?: string) => Promise<void>,
    onSavePrompt?: (title?: string) => Promise<void>
  ) => Promise<void>;
}

export const useModals = (): UseModalsReturn => {
  const [isReferenceLibraryOpen, setIsReferenceLibraryOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [nameModal, setNameModal] = useState<NameModalState>({
    type: null,
    defaultValue: "",
  });

  const openReferenceNameModal = () =>
    setNameModal({
      type: "reference",
      defaultValue: `Reference set (${new Date().toLocaleDateString()})`,
    });

  const openPromptNameModal = () =>
    setNameModal({
      type: "prompt",
      defaultValue: `Prompt preset (${new Date().toLocaleDateString()})`,
    });

  const closeNameModal = () => setNameModal({ type: null, defaultValue: "" });

  const handleNameModalSave = async (
    value: string,
    onSaveReference?: (label?: string) => Promise<void>,
    onSavePrompt?: (title?: string) => Promise<void>
  ) => {
    const trimmed = value.trim();
    if (nameModal.type === "reference" && onSaveReference) {
      await onSaveReference(trimmed || undefined);
    } else if (nameModal.type === "prompt" && onSavePrompt) {
      await onSavePrompt(trimmed || undefined);
    }
    closeNameModal();
  };

  return {
    isReferenceLibraryOpen,
    isPromptLibraryOpen,
    isPaymentModalOpen,
    nameModal,
    setIsReferenceLibraryOpen,
    setIsPromptLibraryOpen,
    setIsPaymentModalOpen,
    openReferenceNameModal,
    openPromptNameModal,
    closeNameModal,
    handleNameModalSave,
  };
};
