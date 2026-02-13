import {
  CaptionRules,
  CustomGuidelines,
  Hashtags,
  ReferenceImage,
  SceneResult,
} from "../../types";
import { Scene } from "../../types/scene";

export interface DashboardLayoutProps {
  projectName: string;
  onProjectNameChange?: (value: string) => void;
  references: ReferenceImage[];
  onUpload: () => void;
  onOpenLibrary: () => void;
  onRemoveReference?: (id: string) => void;
  topic: string;
  onTopicChange: (value: string) => void;
  onGenerateTopicScenes: (
    topicOverride?: string,
    count?: number,
    customGuideline?: string
  ) => void;
  isTopicGenerating: boolean;
  topicError?: string | null;
  scenes: Scene[];
  activeSceneIndex: number;
  onSceneSelect: (index: number) => void;
  onAddScene: () => void;
  onRemoveScene?: (index: number) => void;
  onSaveScene: (index: number, title: string, description: string) => void;
  previewImageUrl?: string;
  isGenerating: boolean;
  disableGenerate: boolean;
  onGenerateAll: () => void;
  onRegenerateActive: () => void;
  transparentBackground: boolean;
  onTransparentBackgroundChange: (value: boolean) => void;
  rules: CaptionRules;
  hashtags: Hashtags;
  selectedHashtags: Hashtags;
  onSelectedHashtagsChange: (next: Hashtags) => void;
  guidelines: CustomGuidelines;
  onGuidelinesChange?: (guidelines: CustomGuidelines) => void;
  captions: {
    tiktok: string;
    instagram: string;
  };
  onGenerateCaption?: (
    platform: "tiktok" | "instagram",
    options: { rules: string; hashtags: string[] }
  ) => Promise<void> | void;
  results: SceneResult[];
  onRegenerateResult: (index: number) => void;
  allowRegenerate?: boolean;
  onBackToEditor?: () => void;
}
