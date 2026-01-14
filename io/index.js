import http from "http";
import socketIO from "socket.io";
import axios from "axios";

const texts = require("../utils/texts");

export default function async() {
  this.nuxt.hook("render:before", async (renderer) => {
    const server = http.createServer(this.nuxt.renderer.app);
    const io = socketIO(server);

    const SYSTEM_USER = {
      username: texts.systemUser.username,
      color: texts.systemUser.color, // RED, currently overwritten by rainbow effect
      admin: true,
    };
    // overwrite nuxt.server.listen()
    this.nuxt.server.listen = (port, host) =>
      new Promise((resolve) =>
        server.listen(
          process.env.PORT || 3000,
          process.env.HOST || "0.0.0.0",
          resolve
        )
      );
    // close this server on 'close' event
    this.nuxt.hook("close", async (nuxt) => {
      nuxt.server.close;
    });

    const config = require("../nuxt.config.js");

    const users = [];
    const connections = [];
    const messages = [];
    const sources = [];
    let emotes = [];

    if (
      config.default.publicRuntimeConfig.initialSourceType.length > 1 &&
      config.default.publicRuntimeConfig.initialSourceUrl.length > 1
    ) {
      sources.push({
        type: config.default.publicRuntimeConfig.initialSourceType,
        file: config.default.publicRuntimeConfig.initialSourceUrl,
        label: "source",
      });
    }

    // Fetch emotes
    const fetchEmotes = async () => {
      // BTTV
      console.log("Fetching BTTV emotes...");
      try {
        // BTTV Global
        const globalEmotes = await axios.get(
          "https://api.betterttv.net/3/cached/emotes/global"
        );

        for (const emote of globalEmotes.data) {
          emotes.push({
            id: emote.id,
            code: emote.code,
            source: "bttv",
          });
        }

        // BTTV Shared Top
        const sharedEmotes = await axios.get(
          "https://api.betterttv.net/3/emotes/shared/top?limit=100"
        );

        for (const emote of sharedEmotes.data) {
          emotes.push({
            id: emote.emote.id,
            code: emote.emote.code,
            source: "bttv",
          });
        }

      } catch (error) {
        console.log('Error fetching BTTV emotes: ', error);
      }
      // FFZ
      console.log("Fetching FFZ emotes...");
      const ffzEmotes = await axios.get(
        "https://api.frankerfacez.com/v1/emotes?q=&sort=count-desc&per_page=200"
      );
      // Format FFZ emotes
      for await (const emote of ffzEmotes.data.emoticons) {
        const newEmoteObject = {
          id: emote.id,
          code: emote.name,
          source: "ffz",
        };
        emotes.push(newEmoteObject);
      }
      console.log("Fetching FFZ emotes... (Animated this time)");
      const ffzEmotesAnim = await axios.get(
        "https://api.frankerfacez.com/v1/emotes?q=&sort=count-desc&animated=true&per_page=50"
      );
      // Format FFZ emotes
      for await (const emote of ffzEmotesAnim.data.emoticons) {
        const newEmoteObject = {
          id: emote.id,
          code: emote.name,
          source: "ffzA",
        };
        emotes.push(newEmoteObject);
      }
    };
    await fetchEmotes();
    console.log("Done with emotes");

    io.on("connection", (socket) => {
      connections.push(socket);

      socket.on("newUserConnection", (user) => {
        const userObject = {
          id: socket.id,
          username: user.username,
          color: user.color,
          admin: false,
        };
        users.push(userObject);

        io.emit("usersList", users);
        io.to(socket.id).emit("sourcesList", sources);
        io.to(socket.id).emit("emoteDictionary", emotes);
        // TODO: SEND STATE TO USER
        io.emit("newChatMessage", {
          message: texts.messages.userJoined.replace(
            "{username}",
            user.username
          ),
          user: SYSTEM_USER,
        });
        io.emit("playSound", {
          type: "join",
        });
      });

      socket.on("addPlayerSource", (source) => {
        sources.push(source);
        io.emit("sourcesList", sources);
      });

      socket.on("removePlayerSource", (index) => {
        sources.splice(index, 1);
        io.emit("sourcesList", sources);
      });

      socket.on("sendPlayerPlay", (username) => {
        io.emit("serverPlayerPlay", username);
      });
      socket.on("sendPlayerPause", (username) => {
        io.emit("serverPlayerPause", username);
      });

      socket.on("sendChatMessage", (message) => {
        if (message.message.length > 0 && message.user.username.length > 0) {
          io.emit("newChatMessage", message);
        }
      });

      socket.on("disconnect", () => {
        const u = users.find((obj) => obj.id == socket.id);

        if (users.indexOf(u) > -1) {
          users.splice(users.indexOf(u), 1);
          io.emit("newChatMessage", {
            message: branding.messages.userLeft.replace(
              "{username}",
              u.username
            ),
            user: SYSTEM_USER,
          });
        }
        io.emit("playSound", {
          type: "leave",
        });
        io.emit("usersList", users);
      });
    });
  });
}
