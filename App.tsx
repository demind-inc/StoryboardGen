import React, { useState, useRef, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import {
  AccountProfile,
  AppMode,
  AuthStatus,
  ImageSize,
  ReferenceImage,
  SceneResult,
} from "./types";
import {
  generateCharacterScene,
  generateSlideshowStructure,
} from "./services/geminiService";
import {
  getCurrentSession,
  signOut,
  upsertProfile,
} from "./services/authService";
import { getSupabaseClient } from "./services/supabaseClient";
import AppHeader from "./components/AppHeader/AppHeader";
import Hero from "./components/Hero/Hero";
import Sidebar from "./components/Sidebar/Sidebar";
import Results from "./components/Results/Results";
import Footer from "./components/Footer/Footer";
import AuthShell from "./components/AuthShell/AuthShell";
import "./App.scss";

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [authEmail, setAuthEmail] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [mode, setMode] = useState<AppMode>("slideshow");
  const [topic, setTopic] = useState<string>("");
  const [manualPrompts, setManualPrompts] = useState<string>(
    "Boy looking confused with question marks around him\nBoy feeling lonely at a cafe table\nBoy looking angry while listening to something"
  );
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [slideshowResults, setSlideshowResults] = useState<SceneResult[]>([]);
  const [manualResults, setManualResults] = useState<SceneResult[]>([]);
  const [size, setSize] = useState<ImageSize>("1K");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingStoryboard, setIsCreatingStoryboard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (_event, newSession) => {
            setSession(newSession);
            if (newSession?.user) {
              const savedProfile = await upsertProfile(newSession.user);
              if (savedProfile) setProfile(savedProfile);
              setAuthStatus("signed_in");
            } else {
              setProfile(null);
              setAuthStatus("signed_out");
            }
          }
        );
        unsubscribe = () => authListener?.subscription.unsubscribe();

        const currentSession = await getCurrentSession();

        if (currentSession?.user) {
          setSession(currentSession);
          const savedProfile = await upsertProfile(currentSession.user);
          if (savedProfile) setProfile(savedProfile);
          setAuthStatus("signed_in");
        } else {
          setAuthStatus("signed_out");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setAuthError(
          "Unable to connect to authentication. Check Supabase keys."
        );
        setAuthStatus("signed_out");
      }
    };

    initialize();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const results = mode === "slideshow" ? slideshowResults : manualResults;
  const generatedCount = results.filter((item) => item.imageUrl).length;
  const totalScenes = results.length;
  const displayEmail = profile?.email || session?.user?.email || "";
  const disableGenerate = isGenerating || references.length === 0;

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

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    setAuthError(null);

    if (!authEmail.trim()) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    setIsSendingLink(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }

      setAuthMessage("Check your email for the magic sign-in link.");
    } catch (error: any) {
      console.error("Sign-in error:", error);
      setAuthError(error.message || "Failed to start sign-in. Try again.");
    } finally {
      setIsSendingLink(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setAuthMessage(null);
    } catch (error: any) {
      console.error("Sign-out error:", error);
      setAuthError(error.message || "Unable to sign out.");
    }
  };

  const removeReference = (id: string) => {
    setReferences((prev) => prev.filter((r) => r.id !== id));
  };

  const handleGenerateStoryboard = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic first.");
      return;
    }
    setIsCreatingStoryboard(true);
    try {
      const slides = await generateSlideshowStructure(topic);
      if (slides.length > 0) {
        const newResults: SceneResult[] = slides.map((slide, idx) => ({
          title: slide.title,
          description: slide.description,
          prompt: slide.prompt,
          isLoading: false,
          isCTA: idx === slides.length - 1,
        }));
        setSlideshowResults(newResults);
      }
    } catch (error) {
      console.error("Storyboard error:", error);
      alert("Failed to generate storyboard. Check your connection/key.");
    } finally {
      setIsCreatingStoryboard(false);
    }
  };

  const handleRegenerate = async (index: number) => {
    if (references.length === 0) {
      alert(
        "Please upload at least one reference image for character consistency."
      );
      return;
    }

    const setter =
      mode === "slideshow" ? setSlideshowResults : setManualResults;
    const currentList = mode === "slideshow" ? slideshowResults : manualResults;
    const targetResult = currentList[index];

    if (!targetResult || targetResult.isCTA) return;

    setter((prev) =>
      prev.map((res, idx) =>
        idx === index ? { ...res, isLoading: true, error: undefined } : res
      )
    );

    try {
      const imageUrl = await generateCharacterScene(
        targetResult.prompt,
        references,
        size
      );
      setter((prev) =>
        prev.map((res, idx) =>
          idx === index ? { ...res, imageUrl, isLoading: false } : res
        )
      );
    } catch (error: any) {
      console.error("Regeneration error:", error);
      setter((prev) =>
        prev.map((res, idx) =>
          idx === index
            ? {
                ...res,
                error: error.message || "Generation failed",
                isLoading: false,
              }
            : res
        )
      );
    }
  };

  const startGeneration = async () => {
    if (references.length === 0) {
      alert(
        "Please upload at least one reference image for character consistency."
      );
      return;
    }

    setIsGenerating(true);

    if (mode === "manual") {
      const promptList = manualPrompts
        .split("\n")
        .filter((p) => p.trim() !== "");
      if (promptList.length === 0) {
        alert("Please enter some manual prompts.");
        setIsGenerating(false);
        return;
      }

      const initialManualResults = promptList.map(
        (p) => ({ prompt: p, isLoading: true } as SceneResult)
      );
      setManualResults(initialManualResults);

      for (let i = 0; i < initialManualResults.length; i++) {
        try {
          const imageUrl = await generateCharacterScene(
            promptList[i],
            references,
            size
          );
          setManualResults((prev) =>
            prev.map((res, idx) =>
              idx === i ? { ...res, imageUrl, isLoading: false } : res
            )
          );
        } catch (error: any) {
          console.error("Manual generation error:", error);
          setManualResults((prev) =>
            prev.map((res, idx) =>
              idx === i
                ? { ...res, error: error.message, isLoading: false }
                : res
            )
          );
        }
      }
    } else {
      if (slideshowResults.length === 0) {
        alert("Please create a storyboard first.");
        setIsGenerating(false);
        return;
      }

      setSlideshowResults((prev) =>
        prev.map((res) => ({ ...res, isLoading: !res.isCTA && !res.imageUrl }))
      );

      for (let i = 0; i < slideshowResults.length; i++) {
        const currentRes = slideshowResults[i];
        if (currentRes.isCTA || currentRes.imageUrl) continue;

        try {
          const imageUrl = await generateCharacterScene(
            currentRes.prompt,
            references,
            size
          );
          setSlideshowResults((prev) =>
            prev.map((res, idx) =>
              idx === i ? { ...res, imageUrl, isLoading: false } : res
            )
          );
        } catch (error: any) {
          console.error("Slideshow generation error:", error);
          setSlideshowResults((prev) =>
            prev.map((res, idx) =>
              idx === i
                ? { ...res, error: error.message, isLoading: false }
                : res
            )
          );
        }
      }
    }

    setIsGenerating(false);
  };

  if (authStatus !== "signed_in") {
    return (
      <AuthShell
        authEmail={authEmail}
        authMessage={authMessage}
        authError={authError}
        authStatus={authStatus}
        isSendingLink={isSendingLink}
        onEmailChange={setAuthEmail}
        onSubmit={handleSendMagicLink}
      />
    );
  }

  return (
    <div className="app">
      <div className="app__background">
        <span className="app__orb app__orb--left" />
        <span className="app__orb app__orb--right" />
      </div>

      <AppHeader
        mode={mode}
        onModeChange={setMode}
        displayEmail={displayEmail}
        onSignOut={handleSignOut}
        referencesCount={references.length}
        totalScenes={totalScenes}
        size={size}
        onSizeChange={setSize}
        isGenerating={isGenerating}
        onGenerate={startGeneration}
        disableGenerate={disableGenerate}
      />

      <main className="app__body">
        <Hero
          referencesCount={references.length}
          generatedCount={generatedCount}
          size={size}
          mode={mode}
          isGenerating={isGenerating}
          disableGenerate={disableGenerate}
          onUploadClick={triggerUpload}
          onGenerate={startGeneration}
        />

        <div className="app__content">
          <Sidebar
            mode={mode}
            references={references}
            fileInputRef={fileInputRef}
            onUploadClick={triggerUpload}
            onFileChange={handleFileUpload}
            onRemoveReference={removeReference}
            topic={topic}
            onTopicChange={setTopic}
            onGenerateStoryboard={handleGenerateStoryboard}
            isCreatingStoryboard={isCreatingStoryboard}
            manualPrompts={manualPrompts}
            onManualPromptsChange={setManualPrompts}
          />

          <Results
            mode={mode}
            results={results}
            isGenerating={isGenerating}
            onRegenerate={handleRegenerate}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;
