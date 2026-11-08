// Shared color math and user name-style helpers.
// Used by ColorWheel.vue (picker), UsernameDisplay.vue (rendering),
// LoginPrompt.vue (persistence) and io/index.js (server-side validation).

export const NAME_STYLES = {
  solid: 1,
  "gradient-2": 2,
  "gradient-3": 3,
  alternating: 2,
};

export const DEFAULT_STYLE = "solid";

// Expands short hex (#abc -> #aabbcc), validates, lowercases. Returns null
// when the value is not a usable hex color.
export function normalizeColor(color) {
  if (typeof color !== "string") return null;
  let hex = color.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null;
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length !== 6) return null;
  return "#" + hex.toLowerCase();
}

export function randomColor() {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
}

// Returns a random profile: a random style with the right number of random colors.
export function randomProfile() {
  const styleKeys = Object.keys(NAME_STYLES);
  const style = styleKeys[Math.floor(Math.random() * styleKeys.length)];
  const count = NAME_STYLES[style];
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(randomColor());
  }
  return { style, colors };
}

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }) {
  const to = (v) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return "#" + to(r) + to(g) + to(b);
}

// h: 0..360, s: 0..1, v: 0..1
export function rgbToHsv({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

// h: 0..360, s: 0..1, v: 0..1
export function hsvToRgb({ h, s, v }) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

// Returns { style, colors } for a user object. Unknown/legacy shapes fall
// back to "solid"; missing colors are filled with random ones; extra colors
// are trimmed. Legacy profiles ({ username, color }) are migrated.
export function normalizeProfile(user) {
  const style = NAME_STYLES[user.style] ? user.style : DEFAULT_STYLE;
  const count = NAME_STYLES[style];

  let colors = [];
  if (Array.isArray(user.colors)) {
    colors = user.colors.map(normalizeColor).filter(Boolean);
  } else if (user.color) {
    colors = [normalizeColor(user.color)].filter(Boolean);
  }

  while (colors.length < count) {
    colors.push(randomColor());
  }
  return { style, colors: colors.slice(0, count) };
}
