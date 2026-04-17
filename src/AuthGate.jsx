import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (checking) {
    return (
      <div style={wrapperStyle}>
        <div style={{ color: "#888", fontFamily: "Inter, sans-serif" }}>Loading…</div>
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return (
    <>
      {children}
      <SignOutButton />
    </>
  );
}

function LoginScreen() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const sendCode = async (e) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (error) setErrorMsg(error.message);
    else setStep("code");
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    if (!code) return;
    setBusy(true);
    setErrorMsg("");
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) setErrorMsg(error.message);
  };

  return (
    <div style={wrapperStyle}>
      <form onSubmit={step === "email" ? sendCode : verifyCode} style={cardStyle}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
          Sales Dashboard
        </h1>
        <p style={{ color: "#666", fontSize: 13, marginTop: 8, marginBottom: 24 }}>
          {step === "email"
            ? "Enter your email to receive a sign-in code."
            : `Enter the 6-digit code sent to ${email}.`}
        </p>

        {step === "email" ? (
          <>
            <label htmlFor="email" style={labelStyle}>Email</label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="you@example.com"
            />
            <button type="submit" disabled={busy} style={buttonStyle}>
              {busy ? "Sending…" : "Send code"}
            </button>
          </>
        ) : (
          <>
            <label htmlFor="code" style={labelStyle}>Code</label>
            <input
              id="code"
              type="text"
              required
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              style={{ ...inputStyle, letterSpacing: "0.3em", fontSize: 18, textAlign: "center" }}
              placeholder="000000"
            />
            <button type="submit" disabled={busy || code.length < 6} style={buttonStyle}>
              {busy ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); setErrorMsg(""); }}
              style={linkButtonStyle}
            >
              Use a different email
            </button>
          </>
        )}

        {errorMsg && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#e74c3c" }}>{errorMsg}</div>
        )}
      </form>
    </div>
  );
}

function SignOutButton() {
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
  };
  return (
    <button
      onClick={onClick}
      disabled={busy}
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        padding: "6px 12px",
        fontSize: 11,
        fontFamily: "Inter, sans-serif",
        color: "#555",
        background: "rgba(255,255,255,0.9)",
        border: "1px solid #ddd",
        borderRadius: 6,
        cursor: "pointer",
        zIndex: 9999,
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}
    >
      {busy ? "…" : "Sign out"}
    </button>
  );
}

const wrapperStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f8f9fa",
  fontFamily: "Inter, 'Segoe UI', Arial, sans-serif",
};

const cardStyle = {
  width: "100%",
  maxWidth: 360,
  padding: "32px 28px",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#666",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid #d1d5db",
  borderRadius: 6,
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 16,
};

const buttonStyle = {
  width: "100%",
  padding: "10px 12px",
  fontSize: 14,
  fontWeight: 600,
  color: "#fff",
  background: "#1a1a2e",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const linkButtonStyle = {
  width: "100%",
  marginTop: 10,
  padding: "6px 0",
  fontSize: 12,
  color: "#666",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  textDecoration: "underline",
};
