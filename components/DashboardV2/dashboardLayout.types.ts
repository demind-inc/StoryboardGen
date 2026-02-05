import {
  CaptionRules,
  CustomGuidelines,
  ReferenceImage,
  SceneResult,
} from "../../types";

export interface DashboardLayoutProps {
  projectName: string;
  onProjectNameChange?: (value: string) => void;
  references: ReferenceImage[];
  onUpload: () => void;
  onOpenLibrary: () => void;
  onRemoveReference?: (id: string) => void;
  topic: string;
  onTopicChange: (value: string) => void;
  onGenerateTopicScenes: () => void;
  isTopicGenerating: boolean;
  topicError?: string | null;
  promptList: string[];
  activeSceneIndex: number;
  onSceneSelect: (index: number) => void;
  onAddScene: () => void;
  onRemoveScene?: (index: number) => void;
  onSavePrompt: (index: number, value: string) => void;
  previewImageUrl?: string;
  isGenerating: boolean;
  disableGenerate: boolean;
  onGenerateAll: () => void;
  onRegenerateActive: () => void;
  rules: CaptionRules;
  guidelines: CustomGuidelines;
  onGuidelinesChange?: (guidelines: CustomGuidelines) => void;
  captions: {
    tiktok: string;
    instagram: string;
  };
  results: SceneResult[];
  onRegenerateResult: (index: number) => void;
  allowRegenerate?: boolean;
  onBackToEditor?: () => void;
}
