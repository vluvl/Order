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
            <label class="label">
              <span class="label-text">color</span>
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="user.color"
                type="color"
                class="h-10 w-10 cursor-pointer rounded"
              />
              <span class="text-sm">{{ user.color }}</span>
            </div>
          </div>

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
                  class="inline-block h-3 w-3 rounded-full"
                  :style="{ backgroundColor: recent.color }"
                ></span>
                {{ recent.username }}
              </button>
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
import { adjectives, substantives } from "~/utils/names.js";

const RECENT_USERS_KEY = "order.recentUsers";
const RECENT_USERS_MAX = 5;

export default {
  data() {
    return {
      user: {
        username: "",
        color: "#ffffff", // placeholder for SSR; set client-side in mounted()
      },
      recentUsers: [],
    };
  },
  mounted() {
    // Client-only: this component is SSR-rendered, so localStorage must
    // only be touched after hydration.
    this.recentUsers = this.loadRecentUsers();
    const mostRecent = this.recentUsers[0];
    if (mostRecent) {
      this.user.username = mostRecent.username;
      this.user.color =
        this.normalizeColor(mostRecent.color) || this.randomColor();
    } else {
      this.user.color = this.randomColor();
    }
  },
  methods: {
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
    randomColor() {
      return (
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0")
      );
    },
    // <input type="color"> requires a full 7-char hex (#rrggbb).
    // Expands short hex like #abc to #aabbcc; returns null when invalid.
    normalizeColor(color) {
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
    },
    selectRecent(recent) {
      this.user.username = recent.username;
      this.user.color =
        this.normalizeColor(recent.color) || this.randomColor();
    },
    saveRecentUser() {
      const entry = { username: this.user.username, color: this.user.color };
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
      if (this.user.username.length === 0) {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = substantives[Math.floor(Math.random() * substantives.length)];
        this.user.username = noun + " " + adj; // revert this to make more sense in english
      }
      // The color is whatever the user picked (or was prefilled); only
      // regenerate it if it is not a valid #rrggbb value.
      this.user.color =
        this.normalizeColor(this.user.color) || this.randomColor();
      this.$store.commit("setUser", this.user);
      this.$root.mainSocket.emit("newUserConnection", this.user);
      this.saveRecentUser();
    },
  },
};
</script>

<style></style>
