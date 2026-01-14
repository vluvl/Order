const fs = require("fs");
const path = require("path");

const defaultPath = path.join(__dirname, "..", "config", "text.default.json");
const overridePath = "/app/config/text.json";

function loadtexts() {
  const defaults = JSON.parse(fs.readFileSync(defaultPath, "utf-8"));

  if (!fs.existsSync(overridePath)) {
    return defaults;
  }

  const override = JSON.parse(fs.readFileSync(overridePath, "utf-8"));
  return {
    ...defaults,
    ...override,
    systemUser: {
      ...defaults.systemUser,
      ...(override.systemUser || {})
    },
    messages: {
      ...defaults.messages,
      ...(override.messages || {})
    }
  };
}

module.exports = loadtexts();
