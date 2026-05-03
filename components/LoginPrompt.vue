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

          <div class="modal-action">
            <button type="submit" class="btn btn-primary">Connect</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { adjectives, substantives } from "~/utils/names";

export default {
  data() {
    return {
      user: {
        username: "",
        color: "null",
      },
    };
  },
  methods: {
    connect() {
      if (this.user.username.length > 0) {
        this.user.color =
          "#" + Math.floor(Math.random() * 16777215).toString(16);
        this.$store.commit("setUser", this.user);
        this.$root.mainSocket.emit("newUserConnection", this.user);
      } else {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = substantives[Math.floor(Math.random() * substantives.length)];
        this.user.username = adj + " " + noun;
        this.user.color =
          "#" + Math.floor(Math.random() * 16777215).toString(16);
        this.$store.commit("setUser", this.user);
        this.$root.mainSocket.emit("newUserConnection", this.user);
      }
    },
  },
};
</script>

<style></style>
