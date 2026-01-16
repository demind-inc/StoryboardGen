import React from "react";
import ReferencesSection from "../../../components/Dashboard/ReferencesSection";
import PromptsSection from "../../../components/Dashboard/PromptsSection";
import { ReferenceImage } from "../../../types";

interface ManualPanelProps {
  references: ReferenceImage[];
  isSavingReferences: boolean;
  manualPrompts: string;
  isAddingNewPrompt: boolean;
  editingPromptIndex: number | null;
  savingPromptIndex: number | null;
  onUpload: () => void;
  onRemoveReference: (id: string) => void;
  onOpenReferenceLibrary: () => void;
  onSaveReferences: () => void;
  onAddPrompt: () => void;
  onRemovePrompt: (index: number) => void;
  onStartEditPrompt: (index: number) => void;
  onSavePrompt: (index: number | null, value: string) => void;
  onCancelEdit: () => void;
  onSaveIndividualPrompt: (index: number) => void;
  onOpenPromptLibrary: () => void;
}

const ManualPanel: React.FC<ManualPanelProps> = ({
  references,
  isSavingReferences,
  manualPrompts,
  isAddingNewPrompt,
  editingPromptIndex,
  savingPromptIndex,
  onUpload,
  onRemoveReference,
  onOpenReferenceLibrary,
  onSaveReferences,
  onAddPrompt,
  onRemovePrompt,
  onStartEditPrompt,
  onSavePrompt,
  onCancelEdit,
  onSaveIndividualPrompt,
  onOpenPromptLibrary,
}) => {
  return (
    <>
      <ReferencesSection
        references={references}
        isSavingReferences={isSavingReferences}
        onUpload={onUpload}
        onRemove={onRemoveReference}
        onOpenLibrary={onOpenReferenceLibrary}
        onSave={onSaveReferences}
      />
      <PromptsSection
        prompts={manualPrompts}
        isAddingNewPrompt={isAddingNewPrompt}
        editingPromptIndex={editingPromptIndex}
        savingPromptIndex={savingPromptIndex}
        onAddPrompt={onAddPrompt}
        onRemovePrompt={onRemovePrompt}
        onStartEdit={onStartEditPrompt}
        onSavePrompt={onSavePrompt}
        onCancelEdit={onCancelEdit}
        onSaveIndividualPrompt={onSaveIndividualPrompt}
        onOpenLibrary={onOpenPromptLibrary}
      />
    </>
  );
};

export default ManualPanel;
