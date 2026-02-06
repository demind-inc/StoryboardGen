export type ImageSize = "1K";
export type AppMode = "manual";
export type AuthStatus = "checking" | "signed_out" | "signed_in";
export type SubscriptionPlan = "basic" | "pro" | "business";

export interface SceneResult {
  prompt: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  isLoading: boolean;
  error?: string;
}

export interface ReferenceImage {
  id: string;
  data: string; // base64
  mimeType: string;
}

export interface ReferenceLibraryItem {
  id: string;
  setId: string;
  label: string | null;
  url: string; // URL to image in Supabase Storage
  mimeType: string;
  createdAt?: string | null;
}

export interface ReferenceSet {
  setId: string;
  label: string | null;
  images: ReferenceLibraryItem[];
  createdAt?: string | null;
}

export interface PromptPreset {
  id: string;
  title: string;
  content: string;
  createdAt?: string | null;
}

export interface AccountProfile {
  id: string;
  email: string | null;
  full_name?: string | null;
  last_sign_in_at?: string | null;
  created_at?: string | null;
}

export interface MonthlyUsage {
  userId: string;
  periodStart: string;
  used: number;
  monthlyLimit: number;
  remaining: number;
}

export interface RuleGroup {
  name: string;
  rule: string;
  isDefault?: boolean;
}

export interface CaptionRules {
  tiktok: RuleGroup[];
  instagram: RuleGroup[];
}

export type CustomGuidelines = RuleGroup[];
export type Hashtags = string[];

export interface ProjectSummary {
  id: string;
  name: string;
  prompts: string[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProjectOutput {
  id: string;
  sceneIndex: number;
  prompt: string;
  title?: string;
  description?: string;
  imageUrl: string;
  mimeType: string;
  createdAt?: string | null;
}

export interface ProjectDetail {
  id: string;
  name: string;
  prompts: string[];
  captions: {
    tiktok: string[];
    instagram: string[];
  };
  outputs: ProjectOutput[];
  createdAt?: string | null;
  updatedAt?: string | null;
}
