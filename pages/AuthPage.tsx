import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import AuthShell from "../components/AuthShell/AuthShell";
import { useEffect } from "react";

const AuthPage: React.FC = () => {
  const {
    authStatus,
    authEmail,
    authPassword,
    authMessage,
    authError,
    isLoading,
    isSignUpMode,
    setAuthEmail,
    setAuthPassword,
    toggleAuthMode,
    signIn,
    signUp,
  } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (authStatus === "signed_in") {
      navigate("/dashboard", { replace: true });
    }
  }, [authStatus, navigate]);

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
    <AuthShell
      authEmail={authEmail}
      authPassword={authPassword}
      authMessage={authMessage}
      authError={authError}
      authStatus={authStatus}
      isLoading={isLoading}
      isSignUpMode={isSignUpMode}
      onEmailChange={setAuthEmail}
      onPasswordChange={setAuthPassword}
      onToggleAuthMode={toggleAuthMode}
      onSignIn={signIn}
      onSignUp={signUp}
    />
  );
};

export default AuthPage;
