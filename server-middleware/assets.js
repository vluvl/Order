const fs = require("fs");
const path = require("path");
const mime = require("mime");

module.exports = function (req, res, next) {
  if (!req.url.startsWith("/assets/")) {
    return next();
  }

  const relativePath = req.url.replace("/assets/", "");

  const customPath = path.join("/app/custom-assets", relativePath);
  const defaultPath = path.join(__dirname, "..", "static", relativePath);

  let filePath = null;

  if (fs.existsSync(customPath)) {
    filePath = customPath;
  } else if (fs.existsSync(defaultPath)) {
    filePath = defaultPath;
  }

  if (!filePath) {
    res.statusCode = 404;
    res.end("Asset not found");
    return;
  }

  res.setHeader("Content-Type", mime.getType(filePath) || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
};
