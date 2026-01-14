module.exports = {
  mode: "jit",
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
  ],
  theme: {
    extend: {
      animation: {
        "spin-slow": "spin 30s linear infinite",
        "rainbow-slow": "rainbow 45s linear infinite",
      },
      keyframes: {
        rainbow: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      backgroundSize: {
        "200%": "200% 200%",
      },
      colors: {
        neutral: {
          900: "#171717",
          800: "#262626",
          700: "#404040",
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
        },
      },
    },
  },
  plugins: [require("daisyui")],
};
