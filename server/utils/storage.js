const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const sha1 = (input) =>
  crypto.createHash("sha1").update(String(input)).digest("hex");

const ensureDir = (absPath) => {
  fs.mkdirSync(absPath, { recursive: true });
};

const buildPaths = ({
  userId,
  dateKey,
  week,
  day,
  storageRoot = path.join(__dirname, "..", "storage"),
}) => {
  if (!userId) {
    throw new Error("userId is required to build storage paths");
  }

  if (!dateKey) {
    throw new Error("dateKey is required to build storage paths");
  }

  const safeUserKey = sha1(userId);
  const [year, month] = dateKey.split("-");
  const dir = path.join(storageRoot, "baby", safeUserKey, year, month);
  const fileName = `${dateKey}__w${week}-d${day}.png`;
  const filePath = path.join(dir, fileName);
  const publicUrl = `/static/baby/${safeUserKey}/${year}/${month}/${fileName}`;

  return {
    dir,
    fileName,
    filePath,
    publicUrl,
    safeUserKey,
  };
};

module.exports = {
  sha1,
  ensureDir,
  buildPaths,
};
