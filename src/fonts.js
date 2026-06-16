// =============================================
// fonts.js — Google Fonts loading
// Only the active family is fetched at startup; the full set is loaded on
// demand when the Settings font picker needs to render previews.
// =============================================

// Weight axes per family (not every family ships every weight on Google Fonts).
const FONT_WEIGHTS = {
  Inter: "300;400;500;600;700;800;900",
  Poppins: "300;400;500;600;700;800;900",
  "League Spartan": "300;400;500;600;700;800;900",
  "Open Sans": "300;400;500;600;700;800",
  Lexend: "300;400;500;600;700;800;900",
  "Rethink Sans": "400;500;600;700;800",
  "Noto Sans": "300;400;500;600;700;800;900",
  "IBM Plex Sans": "400;500;600;700",
  "JetBrains Mono": "400;500;600;700",
};

const appendStylesheet = (id, href) => {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
};

// Load a single family (idempotent — keeps already-loaded families around so
// switching back doesn't reflow).
export const loadFont = (name) => {
  const weights = FONT_WEIGHTS[name];
  if (!weights) return;
  const family = name.replace(/ /g, "+");
  appendStylesheet(
    `gf-${family.toLowerCase()}`,
    `https://fonts.googleapis.com/css2?family=${family}:wght@${weights}&display=swap`
  );
};

// Load every family in one request — used by the Settings font previews.
export const loadAllFonts = () => {
  const params = Object.entries(FONT_WEIGHTS)
    .map(([name, weights]) => `family=${name.replace(/ /g, "+")}:wght@${weights}`)
    .join("&");
  appendStylesheet("gf-all", `https://fonts.googleapis.com/css2?${params}&display=swap`);
};
