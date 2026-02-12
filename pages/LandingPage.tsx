import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faStar,
  faListAlt,
  faImages,
} from "@fortawesome/free-regular-svg-icons";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import useEmblaCarousel from "embla-carousel-react";
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
    detail:
      "With one click, generate engaging posts,\nimages, captions and hashtags",
    tone: "amber",
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

const showcaseShots = [
  "/assets/showcase/storyboard-input.png",
  "/assets/showcase/storyboard-output.png",
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
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
  });

  useEffect(() => {
    if (authStatus === "signed_in") {
      setShowAuthModal(false);
    }
  }, [authStatus]);

  const handleStart = () => {
    if (authStatus === "signed_in") {
      router.push("/dashboard");
      return;
    }
    setShowAuthModal(true);
  };

  const handlePlanStart = (plan: SubscriptionPlan) => {
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
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setShowAuthModal(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="landing">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden-input"
        onChange={handleFileChange}
      />

      <header className="landing__header">
        <div className="landing__brand">
          <img
            src="/assets/images/logo.png"
            alt="StoryboardGen Logo"
            className="landing__brand-logo"
          />
          <span>StoryboardGen</span>
        </div>

        <nav className="landing__nav">
          {navItems.map(({ label, sectionId }) => (
            <button key={sectionId} onClick={() => scrollToSection(sectionId)}>
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
            Dashboard
          </button>
          <button className="landing__start" onClick={handleStart}>
            Start free
          </button>
        </div>
      </header>

      <main className="landing__main">
        <section className="landing__hero">
          <p className="landing__hero-badge">
            Try our new AI storyboard generator
          </p>
          <h1>Create your next storyboard with one click</h1>
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
            <button
              className="landing__upload-square"
              onClick={handleUploadClick}
            >
              <span className="landing__upload-plus">+</span>
              <span>Upload image</span>
              {uploadedFileName && (
                <small title={uploadedFileName}>{uploadedFileName}</small>
              )}
            </button>
            <button
              type="button"
              className="landing__hero-generate"
              onClick={handleStart}
            >
              Generate
            </button>
          </div>
        </section>

        <section
          id="problem"
          className="landing__section landing__section--problem"
        >
          <div className="landing__problem-layout">
            <div className="landing__problem-left">
              <h3>Why use Storyboardgen?</h3>
              <p>
                Create consistent multi-scene visuals and personalized social
                content—complete with captions and hashtags—from one simple
                prompt.
              </p>
              <button className="landing__problem-cta" onClick={handleStart}>
                Get started for free
              </button>
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

        <section id="flow" className="landing__section landing__section--flow">
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
          <div className="landing__showcase">
            <button
              type="button"
              className="landing__showcase-nav"
              aria-label="Previous image"
              onClick={() => emblaApi?.scrollPrev()}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <div className="landing__showcase-viewport embla" ref={emblaRef}>
              <div className="landing__showcase-container embla__container">
                {showcaseShots.map((src, index) => (
                  <div
                    key={src}
                    className="landing__showcase-shot embla__slide"
                  >
                    <img src={src} alt={`Storyboard preview ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="landing__showcase-nav"
              aria-label="Next image"
              onClick={() => emblaApi?.scrollNext()}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </section>

        <section
          id="pricing"
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

        <section id="faq" className="landing__section landing__section--faq">
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
