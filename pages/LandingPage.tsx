import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faStar,
  faListAlt,
  faImages,
} from "@fortawesome/free-regular-svg-icons";
import {
  faBars,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../providers/AuthProvider";
import { SubscriptionPlan } from "../types";
import AuthShell from "../components/AuthShell/AuthShell";

const heroSteps = [
  {
    number: "1",
    title: "Ideate",
    detail: "Tell us scenes, topic, and\nupload reference images",
    tone: "lavender",
  },
  {
    number: "2",
    title: "Generate",
    detail: "Generate your multi-scene images\nin one click.",
    tone: "amber",
  },
  {
    number: "3",
    title: "Post",
    detail: "Generate captions and hashtags\nfor TikTok and Instagram",
    tone: "mint",
  },
];

const navItems = [
  { label: "Problem", sectionId: "problem" },
  { label: "Solution", sectionId: "flow" },
  { label: "Pricing", sectionId: "pricing" },
  { label: "FAQ", sectionId: "faq" },
];

const whyUseItems = [
  {
    icon: faUser,
    title: "Scene-consistent characters and visuals",
    detail:
      "Upload references once and keep characters, outfits, and visual style consistent across every scene.",
  },
  {
    icon: faStar,
    title: "Fast multi-image generation with one prompt",
    detail:
      "Describe your full story in one prompt and create a complete, aligned image set instantly.",
  },
  {
    icon: faListAlt,
    title: "Simple, efficient workflow",
    detail:
      "Upload references, list scenes, and generate\n— fast and streamlined.",
  },
  {
    icon: faImages,
    title: "Personalized social content & slideshows",
    detail:
      "Create customized multi-image posts and slideshows, complete with captions and relevant hashtags.",
  },
];

const pricingPlans = [
  {
    badge: "Free",
    title: "Try it out",
    price: "$0",
    credits: "3 credits",
    note: "Generate 3 images for free.",
    perks: ["3 free images", "No card required"],
    cta: "Start free",
  },
  {
    badge: "Basic",
    title: "For trying the workflow",
    price: "$15/mo",
    credits: "90 credits / month",
    note: "1 credit = 1 image. Credits reset monthly.",
    perks: ["90 images each month", "Email support"],
    cta: "Choose Basic",
  },
  {
    badge: "Pro",
    title: "For weekly storytellers",
    price: "$29/mo",
    credits: "180 credits / month",
    note: "1 credit = 1 image. Credits reset monthly.",
    perks: ["180 images each month", "Email support"],
    cta: "Choose Pro",
    highlight: true,
  },
  {
    badge: "Business",
    title: "For teams and volume",
    price: "$79/mo",
    credits: "600 credits / month",
    note: "1 credit = 1 image. Credits reset monthly.",
    perks: ["600 images each month", "Email support"],
    cta: "Choose Business",
  },
];

const LandingPage: React.FC = () => {
  const router = useRouter();
  const {
    authStatus,
    authEmail,
    authPassword,
    authName,
    authMessage,
    authError,
    isLoading,
    isSignUpMode,
    isResettingPassword,
    requestPasswordReset,
    setAuthEmail,
    setAuthPassword,
    setAuthName,
    toggleAuthMode,
    signIn,
    signUp,
  } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedPreviews, setUploadedPreviews] = useState<
    { url: string; name: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<{ url: string; name: string }[]>([]);
  previewsRef.current = uploadedPreviews;

  const heroRef = useRef<HTMLElement>(null);
  const sectionProblemRef = useRef<HTMLElement>(null);
  const sectionFlowRef = useRef<HTMLElement>(null);
  const sectionPricingRef = useRef<HTMLElement>(null);
  const sectionFaqRef = useRef<HTMLElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fadeInRefs = useMemo(
    () => [
      heroRef,
      sectionProblemRef,
      sectionFlowRef,
      sectionPricingRef,
      sectionFaqRef,
    ],
    []
  );

  useEffect(() => {
    if (authStatus === "signed_in") {
      setShowAuthModal(false);
    }
  }, [authStatus]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("landing__in-view");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    fadeInRefs.forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });
    return () => observer.disconnect();
  }, [fadeInRefs]);

  useEffect(() => {
    const el = showcaseRef.current;
    const video = videoRef.current;
    if (!el || !video) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleStart = () => {
    setMobileMenuOpen(false);
    if (authStatus === "signed_in") {
      router.push("/dashboard");
      return;
    }
    setShowAuthModal(true);
  };

  const handlePlanStart = (plan: SubscriptionPlan) => {
    setMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("preferred_plan", plan);
      window.localStorage.setItem("start_payment_flow", "1");
    }
    if (authStatus === "signed_in") {
      router.push(`/dashboard?plan=${plan}&openPayment=1`);
      return;
    }
    setShowAuthModal(true);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    setUploadedPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return files.map((f) => ({
        url: URL.createObjectURL(f),
        name: f.name,
      }));
    });
    setUploadedFiles(files);
    e.target.value = "";
  };

  const removePreview = (index: number) => {
    setUploadedPreviews((prev) => {
      const next = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index].url);
      return next;
    });
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleHeaderAccountClick = () => {
    setMobileMenuOpen(false);
    if (authStatus === "signed_in") {
      router.replace("/dashboard");
      return;
    }
    setShowAuthModal(true);
  };

  return (
    <div className="landing">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden-input"
        onChange={handleFileChange}
      />

      <header
        className={`landing__header ${
          mobileMenuOpen ? "landing__header--menu-open" : ""
        }`}
      >
        <div className="landing__header-top">
          <div className="landing__brand">
            <img
              src="/assets/images/logo.png"
              alt="StoryboardGen Logo"
              className="landing__brand-logo"
            />
            <span>StoryboardGen</span>
          </div>
          <button
            type="button"
            className="landing__hamburger"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faBars} />
          </button>
        </div>

        <div className="landing__header-menu">
          <nav className="landing__nav">
            {navItems.map(({ label, sectionId }) => (
              <button
                key={sectionId}
                onClick={() => {
                  scrollToSection(sectionId);
                  setMobileMenuOpen(false);
                }}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="landing__actions">
            <button
              className="landing__dashboard"
              onClick={() =>
                authStatus === "signed_in"
                  ? router.replace("/dashboard")
                  : setShowAuthModal(true)
              }
            >
              Log in
            </button>
            <button className="landing__start" onClick={handleStart}>
              Start free
            </button>
          </div>
        </div>
      </header>

      <main className="landing__main">
        <section className="landing__hero" ref={heroRef}>
          <p className="landing__hero-badge">
            Try our new AI storyboard generator
          </p>
          <h1>
            Create your next storyboard
            <br />
            with one click
          </h1>
          <div className="landing__hero-steps">
            {heroSteps.map((step) => (
              <article key={step.number} className="landing__step-card">
                <span
                  className={`landing__step-number landing__step-number--${step.tone}`}
                >
                  {step.number}
                </span>
                <h3>{step.title}</h3>
                <p className="landing__step-detail">{step.detail}</p>
              </article>
            ))}
          </div>

          <div className="landing__hero-form">
            <label className="landing__field">
              <span>What do you want to create?</span>
              <textarea placeholder="Describe your story scenes, target audience, and desired outcome..." />
            </label>
            <div className="landing__upload-row">
              <button
                className="landing__upload-square"
                onClick={handleUploadClick}
              >
                <span className="landing__upload-plus">+</span>
                <span>Upload image{uploadedFiles.length !== 1 ? "s" : ""}</span>
                {uploadedFiles.length > 0 && (
                  <small title={uploadedFiles.map((f) => f.name).join(", ")}>
                    {uploadedFiles.length} file
                    {uploadedFiles.length !== 1 ? "s" : ""} selected
                  </small>
                )}
              </button>
              {uploadedPreviews.length > 0 && (
                <div className="landing__upload-previews">
                  {uploadedPreviews.map((preview, index) => (
                    <div
                      key={preview.url}
                      className="landing__upload-preview"
                      title={preview.name}
                    >
                      <img
                        src={preview.url}
                        alt={`Preview ${index + 1}`}
                        title={preview.name}
                      />
                      <button
                        type="button"
                        className="landing__upload-preview-remove"
                        onClick={() => removePreview(index)}
                        aria-label={`Remove ${preview.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className="landing__hero-generate"
              onClick={handleStart}
            >
              <FontAwesomeIcon
                icon={faWandMagicSparkles}
                style={{ width: 14, height: 14 }}
              />
              <span>Generate</span>
            </button>
          </div>
        </section>

        <section
          id="problem"
          ref={sectionProblemRef}
          className="landing__section landing__section--problem"
        >
          <div className="landing__problem-layout">
            <div className="landing__problem-left">
              <h3>Why use StoryboardGen?</h3>
              <p>
                Create consistent multi-scene visuals and personalized social
                content—complete with captions and hashtags—from one simple
                prompt.
              </p>
            </div>
            <div className="landing__problem-right">
              {whyUseItems.map((item) => (
                <article key={item.title} className="landing__problem-item">
                  <span className="landing__problem-icon">
                    <FontAwesomeIcon icon={item.icon as never} />
                  </span>
                  <div>
                    <p className="landing__problem-title">{item.title}</p>
                    <p className="landing__problem-detail">{item.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="flow"
          ref={sectionFlowRef}
          className="landing__section landing__section--flow"
        >
          <div className="landing__section-head landing__section-head--flow">
            <h2 className="landing__flow-title">
              One tool, endless possibilities
            </h2>
            <p className="landing__flow-subtitle">
              StoryboardGen helps you create and grow with AI across social
              media, faster and simpler.
            </p>
            <button className="landing__flow-cta" onClick={handleStart}>
              Get started for free
            </button>
          </div>
          <div className="landing__showcase" ref={showcaseRef}>
            <div className="landing__showcase-video-wrap">
              <video
                ref={videoRef}
                className="landing__showcase-video"
                src="/assets/demo/storyboardgen-demo-2026-0213.mp4"
                playsInline
                muted
                loop
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>

        <section
          id="pricing"
          ref={sectionPricingRef}
          className="landing__section landing__section--pricing"
        >
          <div className="landing__section-head">
            <p className="landing__eyebrow">Pricing</p>
            <h2>Pick a plan, get monthly credits</h2>
          </div>
          <div className="pricing-grid">
            {pricingPlans.map((plan) => (
              <div className="pricing-card" key={plan.badge}>
                <div className="pricing-card__badge">{plan.badge}</div>
                <h3>{plan.title}</h3>
                <p className="pricing-card__price">{plan.price}</p>
                <p className="pricing-card__credits">{plan.credits}</p>
                <p className="pricing-card__note">{plan.note}</p>
                <button
                  className={`pricing-card__button ${
                    plan.badge === "Free" ? "pricing-card__button--accent" : ""
                  }`}
                  onClick={() =>
                    handlePlanStart(
                      plan.badge.toLowerCase() as SubscriptionPlan
                    )
                  }
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section
          id="faq"
          ref={sectionFaqRef}
          className="landing__section landing__section--faq"
        >
          <div className="landing__section-head">
            <p className="landing__eyebrow">FAQ</p>
            <h2>Quick Answers</h2>
          </div>
          <div className="faq">
            <div className="faq__item">
              <div className="faq__question">
                Do I need to sign in to generate?
              </div>
              <div className="faq__answer">
                Yes. Sign in or create an account to unlock your free images.
              </div>
            </div>
            <div className="faq__item">
              <div className="faq__question">
                How many images should I upload?
              </div>
              <div className="faq__answer">
                We recommend uploading 1–3 reference images to lock your
                character and style.
              </div>
            </div>
            <div className="faq__item">
              <div className="faq__question">Are the outputs watermarked?</div>
              <div className="faq__answer">
                No. You can download your generated images without watermarks.
              </div>
            </div>
            <div className="faq__item">
              <div className="faq__question">Can I edit the prompt?</div>
              <div className="faq__answer">
                Yes. You can update your prompt and regenerate the images at any
                time.
              </div>
            </div>
          </div>
        </section>
      </main>

      {showAuthModal && (
        <div
          className="landing__modal-backdrop"
          role="dialog"
          aria-modal="true"
        >
          <div className="landing__modal">
            <button
              className="landing__modal-close"
              onClick={() => setShowAuthModal(false)}
            >
              ×
            </button>
            <AuthShell
              isResettingPassword={isResettingPassword}
              onRequestPasswordReset={requestPasswordReset}
              authEmail={authEmail}
              authPassword={authPassword}
              authName={authName}
              authMessage={authMessage}
              authError={authError}
              authStatus={authStatus}
              isLoading={isLoading}
              isSignUpMode={isSignUpMode}
              onEmailChange={setAuthEmail}
              onPasswordChange={setAuthPassword}
              onNameChange={setAuthName}
              onToggleAuthMode={toggleAuthMode}
              onSignIn={signIn}
              onSignUp={signUp}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
