import React from "react";
import { useRouter } from "next/router";
import { useAuth } from "../providers/AuthProvider";
import AuthShell from "../components/AuthShell/AuthShell";
import { useEffect } from "react";

const AuthPage: React.FC = () => {
  const {
    authStatus,
    authEmail,
    authPassword,
    authName,
    authMessage,
    authError,
    isLoading,
    isResettingPassword,
    isSignUpMode,
    setAuthEmail,
    setAuthPassword,
    setAuthName,
    toggleAuthMode,
    requestPasswordReset,
    signIn,
    signUp,
  } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (authStatus === "signed_in") {
      router.replace("/dashboard");
    }
  }, [authStatus, router]);

  // Show loading state while checking auth
  if (authStatus === "checking") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>Checking your session...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <AuthShell
        authEmail={authEmail}
        authPassword={authPassword}
        authName={authName}
        authMessage={authMessage}
        authError={authError}
        authStatus={authStatus}
        isLoading={isLoading}
        isResettingPassword={isResettingPassword}
        isSignUpMode={isSignUpMode}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onNameChange={setAuthName}
        onToggleAuthMode={toggleAuthMode}
        onRequestPasswordReset={requestPasswordReset}
        onSignIn={signIn}
        onSignUp={signUp}
      />
    </div>
  );
};

export default AuthPage;
