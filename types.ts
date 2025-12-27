
export type ImageSize = '1K' | '2K' | '4K';

export interface SlideContent {
  title: string;
  description: string;
  prompt: string;
}

export interface SceneResult {
  prompt: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  isLoading: boolean;
  error?: string;
  isCTA?: boolean;
}

export interface ReferenceImage {
  id: string;
  data: string; // base64
  mimeType: string;
}

declare global {
  /**
   * Defines the AIStudio interface in the global scope to ensure consistency with
   * pre-configured environment definitions and resolve type mismatch errors.
   */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    /**
     * Extends the global Window interface with the correct type for 'aistudio'.
     */
    // Fixed: Added 'readonly' modifier to match existing declarations of 'aistudio' in the execution context and fix the "identical modifiers" error.
    readonly aistudio: AIStudio;
  }
}