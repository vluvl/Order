export const state = () => ({
  user: {
    username: null,
    style: "solid",
    colors: ["#ffffff"],
    admin: false,
  },
});

export const mutations = {
  setUser(state, user) {
    state.user.username = user.username;
    state.user.style = user.style || "solid";
    state.user.colors =
      Array.isArray(user.colors) && user.colors.length > 0
        ? user.colors
        : ["#ffffff"];
  },
};
