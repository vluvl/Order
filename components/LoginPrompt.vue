<template>
  <div>
    <div class="modal pointer-events-auto visible opacity-100">
      <div class="modal-box">
        <h1 class="text-xl font-bold">{{ $config.texts.appName }}</h1>
        <p>{{ $config.texts.loginPrompt }}</p>
        <form @submit.prevent="connect">
          <div class="form-control mt-1">
            <input
              v-model="user.username"
              type="text"
              placeholder="username"
              maxlength="45"
              class="input-bordered input"
            />
          </div>

          <div class="form-control mt-2">
            <button
              type="button"
              class="btn btn-sm btn-outline"
              @click="showSettings = !showSettings"
            >
              {{ showSettings ? "collapse settings" : "expand settings" }}
            </button>
          </div>

          <div v-if="showSettings">
          <!-- Name style -->
          <div class="form-control mt-2">
            <label class="label">
              <span class="label-text">name style</span>
            </label>
            <div class="btn-group">
              <button
                v-for="style in styles"
                :key="style.id"
                type="button"
                :class="user.style === style.id ? 'btn-primary' : ''"
                class="btn btn-sm"
                @click="setStyle(style.id)"
              >
                {{ style.label }}
              </button>
            </div>
          </div>

          <!-- Color pickers: one wheel, editing whichever slot is selected -->
          <div class="form-control mt-2">
            <label class="label">
              <span class="label-text">
                colors
                <span class="opacity-60">
                  ({{ user.colors.length }} for {{ styleLabel }})
                </span>
              </span>
            </label>
            <div class="flex flex-wrap gap-2 mb-1">
              <button
                v-for="(color, index) in user.colors"
                :key="index"
                type="button"
                class="color-slot"
                :class="{ 'color-slot-active': index === selectedColorIndex }"
                :title="slotLabel(index) + ': ' + color"
                @click="selectedColorIndex = index"
              >
                <span
                  class="color-slot-swatch"
                  :style="{ backgroundColor: color }"
                ></span>
                <span class="color-slot-label">{{ slotLabel(index) }}</span>
              </button>
            </div>
            <p class="text-xs opacity-60 mb-2">{{ colorHint }}</p>
            <color-wheel v-model="user.colors[selectedColorIndex]" :size="140" />
          </div>

          <!-- Recent names -->
          <div v-if="recentUsers.length > 0" class="form-control mt-2">
            <label class="label">
              <span class="label-text">recent</span>
            </label>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="recent in recentUsers"
                :key="recent.username"
                type="button"
                class="btn btn-sm btn-outline"
                @click="selectRecent(recent)"
              >
                <span
                  class="inline-block h-3 w-6 rounded-sm mr-1"
                  :style="recentSwatchStyle(recent)"
                ></span>
                {{ recent.username }}
              </button>
            </div>
          </div>
          </div>

          <div class="modal-action">
            <button type="submit" class="btn btn-primary">Connect</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import ColorWheel from "~/components/ColorWheel.vue";
import {
  NAME_STYLES,
  DEFAULT_STYLE,
  randomColor,
  randomProfile,
  normalizeProfile,
} from "~/utils/color.js";

const RECENT_USERS_KEY = "order.recentUsers";
const RECENT_USERS_MAX = 5;

export default {
  components: {
    ColorWheel,
  },
  data() {
    return {
      user: {
        username: "",
        style: DEFAULT_STYLE,
        colors: ["#ffffff"], // placeholder for SSR; set client-side in mounted()
      },
      recentUsers: [],
      showSettings: false,
      selectedColorIndex: 0,
      styles: [
        { id: "solid", label: "Solid" },
        { id: "gradient-2", label: "2-Color Gradient" },
        { id: "gradient-3", label: "3-Color Gradient" },
        { id: "alternating", label: "Alternating" },
      ],
    };
  },
  computed: {
    styleLabel() {
      const s = this.styles.find((s) => s.id === this.user.style);
      return s ? s.label : this.user.style;
    },
    // Explains what the slots mean for the current style.
    colorHint() {
      switch (this.user.style) {
        case "gradient-2":
        case "gradient-3":
          return "gradient runs left to right";
        case "alternating":
          return "A colors the 1st, 3rd, 5th… letters; B the 2nd, 4th, 6th…";
        default:
          return "";
      }
    },
  },
  mounted() {
    // Client-only: this component is SSR-rendered, so localStorage must
    // only be touched after hydration.
    this.recentUsers = this.loadRecentUsers();
    // Fresh visit: empty username and a random style/colors setting.
    // Saved profiles are only offered through the recent list.
    const profile = randomProfile();
    this.user.style = profile.style;
    this.user.colors = profile.colors;
  },
  methods: {
    // Label under each swatch: numbers for gradients, A/B for alternating.
    slotLabel(index) {
      return this.user.style === "alternating"
        ? index === 0
          ? "A"
          : "B"
        : String(index + 1);
    },
    loadRecentUsers() {
      try {
        const raw = window.localStorage.getItem(RECENT_USERS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
          .filter(
            (entry) =>
              entry && typeof entry.username === "string" && entry.username
          )
          .slice(0, RECENT_USERS_MAX);
      } catch (e) {
        // localStorage can throw (private mode, blocked storage, etc.)
        return [];
      }
    },
    setStyle(style) {
      const count = NAME_STYLES[style];
      if (!count) return;
      this.user.style = style;
      const colors = this.user.colors.slice(0, count);
      while (colors.length < count) {
        colors.push(randomColor());
      }
      this.user.colors = colors;
      this.selectedColorIndex = 0;
    },
    selectRecent(recent) {
      this.user.username = recent.username;
      const profile = normalizeProfile(recent);
      this.user.style = profile.style;
      this.user.colors = profile.colors;
      this.selectedColorIndex = 0;
    },
    // Small preview swatch for a recent entry (matches its style).
    recentSwatchStyle(recent) {
      const profile = normalizeProfile(recent);
      if (profile.style === "solid") {
        return { backgroundColor: profile.colors[0] };
      }
      if (profile.style === "alternating") {
        return {
          background: `linear-gradient(90deg, ${profile.colors[0]} 50%, ${profile.colors[1]} 50%)`,
        };
      }
      return {
        background: `linear-gradient(90deg, ${profile.colors.join(", ")})`,
      };
    },
    saveRecentUser() {
      const entry = {
        username: this.user.username,
        style: this.user.style,
        colors: this.user.colors.slice(),
      };
      const recent = this.recentUsers.filter(
        (u) => u.username !== entry.username
      );
      recent.unshift(entry);
      const capped = recent.slice(0, RECENT_USERS_MAX);
      this.recentUsers = capped;
      try {
        window.localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(capped));
      } catch (e) {
        // localStorage unavailable; the recent list stays in memory only
      }
    },
    connect() {
      // Empty username -> "user" + hex of the first chosen color.
      if (this.user.username.length === 0) {
        this.user.username = "user" + this.user.colors[0].replace("#", "");
      }
      // Normalize the profile (valid style, exactly the right number of
      // valid colors) before it leaves the browser.
      const profile = normalizeProfile(this.user);
      this.user.style = profile.style;
      this.user.colors = profile.colors;
      this.$store.commit("setUser", this.user);
      this.$root.mainSocket.emit("newUserConnection", this.user);
      this.saveRecentUser();
    },
  },
};
</script>

<style>
.color-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.color-slot-swatch {
  width: 2.75rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  border: 1px solid #404040;
}

.color-slot-active .color-slot-swatch {
  outline: 2px solid #a1a1aa;
  outline-offset: 1px;
}

.color-slot-label {
  font-size: 0.65rem;
  color: #a1a1aa;
}
</style>
