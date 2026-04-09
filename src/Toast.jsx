// =============================================
// Toast.jsx — Toast notification system
// =============================================
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3000, action = null) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, action }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration, action) => addToast(msg, "success", duration, action),
    error:   (msg, duration, action) => addToast(msg, "error", duration ?? 5000, action),
    info:    (msg, duration, action) => addToast(msg, "info", duration, action),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(toast.action?.countdown || 0);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (!toast.action?.countdown) return;
    setCountdown(toast.action.countdown);
    const iv = setInterval(() => {
      setCountdown((p) => {
        if (p <= 1) { clearInterval(iv); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [toast.action?.countdown]);

  const configs = {
    success: { icon: CheckCircle, bg: "#16a34a", border: "#15803d", text: "#fff" },
    error:   { icon: AlertCircle, bg: "#dc2626", border: "#b91c1c", text: "#fff" },
    info:    { icon: Info,        bg: "#2563eb", border: "#1d4ed8", text: "#fff" },
  };
  const { icon: Icon, bg, border, text } = configs[toast.type] || configs.info;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.75rem 1rem",
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: "0.5rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        color: text,
        fontSize: "0.875rem",
        fontWeight: "500",
        minWidth: "260px",
        maxWidth: "420px",
        transform: visible ? "translateX(0)" : "translateX(120%)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s cubic-bezier(.16,1,.3,1), opacity 0.3s cubic-bezier(.16,1,.3,1)",
        pointerEvents: "auto",
      }}
    >
      <Icon size={18} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, lineHeight: "1.4" }}>{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => { toast.action.onClick(); onRemove(toast.id); }}
          style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.4)", cursor: "pointer", color: text, padding: "0.2rem 0.6rem", borderRadius: "0.25rem", fontSize: "0.8125rem", fontWeight: "700", flexShrink: 0, whiteSpace: "nowrap" }}
        >
          {toast.action.countdown ? `${toast.action.label.replace(/ \(\d+s\)$/, "")} (${countdown}s)` : toast.action.label}
        </button>
      )}
      <button
        onClick={() => onRemove(toast.id)}
        style={{ background: "none", border: "none", cursor: "pointer", color: text, opacity: 0.8, padding: "0.125rem", display: "flex", alignItems: "center", flexShrink: 0 }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
      >
        <X size={15} />
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
