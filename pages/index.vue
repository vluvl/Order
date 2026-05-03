<template>
  <div>
    <login-prompt v-if="!$store.state.user.username" />
    <div v-else>
      <div class="grid grid-cols-12">
        <div
          class="xs:col-span-12 max-content-height col-span-10 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-10 2xl:col-span-10"
        >
          <client-only>
            <player />
          </client-only>
        </div>
        <div
  	  class="xs:col-span-12 max-content-height col-span-2 sm:col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-2 2xl:col-span-2 flex flex-col h-full"
	>
		<!-- Toggle -->
  		<button
    		@click="showUsers = !showUsers"
    		class="h-10 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-sm"
 		>
    		{{ showUsers ? "Hide users" : "Show users" }}
  		</button>

  		<!-- Users -->
  	<transition name="collapse">
    		<div v-show="showUsers" class="users-panel">
      		  <users />
    		</div>
  	</transition>

  		<!-- Chat -->
  	  <div class="chat-panel flex-1 min-h-0">
    		<chat />
  	  </div>
	</div>

      </div>
      <!-- Settings -->
      <div class="container mx-auto mt-4">
        <div class="grid grid-cols-12 gap-2">
          <div class="col-span-8"><settings /></div>

        </div>
      </div>

      <!-- Stream Statistics -->
      <div class="container mx-auto mt-4">
        <div class="grid grid-cols-12 gap-2">
          <div class="col-span-8"><stream-stats /></div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
import LoginPrompt from "~/components/LoginPrompt.vue";
import Settings from "~/components/Settings.vue";
import Users from "~/components/Users.vue";
import Chat from "~/components/Chat/Chat.vue";
import StreamStats from "~/components/StreamStats.vue";
export default {
  data() {
      return {
        showUsers: true,
      };
    },
  components: {
    Player: () =>
      process.client ? import("@/components/Player/Player.vue") : null,
    LoginPrompt,
    Settings,
    Users,
    Chat,
    StreamStats,
  },
};
</script>

<style>
.max-content-height {
  max-height: calc(100vh - 4rem);
  height: calc(100vh - 4rem);
}
.users-panel {
  height: 12rem; /* adjust as you like */
  overflow-y: auto;
  border-bottom: 1px solid #333;
}

.chat-panel {
  flex: 1 1 auto; /* grows, shrinks properly */
  min-height: 0;   /* needed for flex + overflow */
  overflow: hidden;
  position: relative; /* required for absolute emote menu */
}

/* Smooth collapse animation */
.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
}

.collapse-enter,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave {
  max-height: 12rem; /* same as users-panel height */
  opacity: 1;
}

/* Users container */
.users-panel {
  max-height: 12rem;
  overflow-y: auto;
  border-bottom: 1px solid #333;
}

</style>
