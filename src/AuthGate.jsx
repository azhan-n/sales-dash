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
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus("sending");
    setErrorMsg("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div style={wrapperStyle}>
      <form onSubmit={onSubmit} style={cardStyle}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
          Sales Dashboard
        </h1>
        <p style={{ color: "#666", fontSize: 13, marginTop: 8, marginBottom: 24 }}>
          Sign in with a magic link to continue.
        </p>

        {status === "sent" ? (
          <div style={{ fontSize: 14, color: "#27ae60", lineHeight: 1.5 }}>
            Check your inbox for a sign-in link sent to <b>{email}</b>.
          </div>
        ) : (
          <>
            <label htmlFor="email" style={labelStyle}>Email</label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="you@example.com"
            />
            <button type="submit" disabled={status === "sending"} style={buttonStyle}>
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
            {errorMsg && (
              <div style={{ marginTop: 12, fontSize: 12, color: "#e74c3c" }}>{errorMsg}</div>
            )}
          </>
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
