<template>
  <span class="username-display">
    <!-- Alternating: one color per letter, even/odd -->
    <template v-if="profile.style === 'alternating'">
      <span
        v-for="(ch, i) in letters"
        :key="i"
        :style="{
          color: i % 2 === 0 ? profile.colors[0] : profile.colors[1],
        }"
        >{{ ch }}</span
      >
    </template>
    <!-- Gradients: animated background-clip text (like the system message) -->
    <span
      v-else-if="isGradient"
      class="name-gradient"
      :style="{ 'background-image': gradientBackground }"
      >{{ user.username }}</span
    >
    <!-- Solid -->
    <span v-else :style="{ color: profile.colors[0] }">{{
      user.username
    }}</span>
  </span>
</template>

<script>
import { normalizeProfile } from "~/utils/color.js";

export default {
  name: "UsernameDisplay",
  props: {
    user: {
      type: Object,
      required: true,
    },
  },
  computed: {
    profile() {
      return normalizeProfile(this.user);
    },
    isGradient() {
      return (
        this.profile.style === "gradient-2" ||
        this.profile.style === "gradient-3"
      );
    },
    letters() {
      return Array.from(this.user.username || "");
    },
    gradientBackground() {
      return `linear-gradient(90deg, ${this.profile.colors.join(", ")})`;
    },
  },
};
</script>

<style>
.name-gradient {
  background-size: 200% 100%;
  animation: name-gradient-slide 8s linear infinite;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

@keyframes name-gradient-slide {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
