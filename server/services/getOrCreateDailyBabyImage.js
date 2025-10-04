const fs = require("fs");
const path = require("path");

const { promises: fsPromises } = fs;

const { computeGA } = require("../utils/ga");
const { ensureDir, buildPaths } = require("../utils/storage");
const { buildWeekPrompt } = require("../utils/prompt");
const { generateImageBuffer } = require("./hfGenerate");

const storageRootDefault = path.join(__dirname, "..", "storage");

const fileExists = async (targetPath) => {
  try {
    await fsPromises.access(targetPath, fs.constants.F_OK);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
};

const getFileStats = async (targetPath) => {
  try {
    return await fsPromises.stat(targetPath);
  } catch (error) {
    return null;
  }
};

const readDirSafe = async (targetPath) => {
  try {
    return await fsPromises.readdir(targetPath, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
};

const parseMetadataFromFileName = (fileName) => {
  const match = fileName.match(/^(\d{4}-\d{2}-\d{2})__w(\d+)-d(\d+)\.png$/);

  if (!match) {
    return null;
  }

  return {
    dateKey: match[1],
    week: Number.parseInt(match[2], 10),
    day: Number.parseInt(match[3], 10),
  };
};

const findLatestImage = async ({ storageRoot, safeUserKey }) => {
  const userRoot = path.join(storageRoot, "baby", safeUserKey);
  const yearEntries = await readDirSafe(userRoot);
  const years = yearEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => Number.parseInt(b, 10) - Number.parseInt(a, 10));

  for (const year of years) {
    const monthEntries = await readDirSafe(path.join(userRoot, year));
    const months = monthEntries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => Number.parseInt(b, 10) - Number.parseInt(a, 10));

    for (const month of months) {
      const fileEntries = await readDirSafe(path.join(userRoot, year, month));
      const files = fileEntries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .sort((a, b) => b.localeCompare(a));

      for (const fileName of files) {
        const metadata = parseMetadataFromFileName(fileName);

        if (!metadata) {
          continue;
        }

        const filePath = path.join(userRoot, year, month, fileName);
        const publicUrl = `/static/baby/${safeUserKey}/${year}/${month}/${fileName}`;

        return {
          filePath,
          publicUrl,
          metadata,
        };
      }
    }
  }

  return null;
};

const getOrCreateDailyBabyImage = async ({
  userId,
  profile = {},
  storageRoot = storageRootDefault,
  tz = "Europe/London",
}) => {
  const ga = computeGA(profile, tz);

  if (ga.rawDays < 0 || ga.rawDays > 294) {
    const error = new Error("Gestational age is outside of supported range");
    error.code = "GA_OUT_OF_RANGE";
    throw error;
  }

  const paths = buildPaths({
    userId,
    dateKey: ga.dateKey,
    week: ga.week,
    day: ga.day,
    storageRoot,
  });

  if (await fileExists(paths.filePath)) {
    const stats = await getFileStats(paths.filePath);
    return {
      url: paths.publicUrl,
      filePath: paths.filePath,
      week: ga.week,
      day: ga.day,
      dateKey: ga.dateKey,
      prompt: null,
      isCached: true,
      createdAt: stats?.mtime?.toISOString?.() ?? null,
    };
  }

  const { prompt } = buildWeekPrompt(ga.week);

  try {
    const buffer = await generateImageBuffer(prompt);
    ensureDir(paths.dir);
    await fsPromises.writeFile(paths.filePath, buffer, { mode: 0o600 });

    return {
      url: paths.publicUrl,
      filePath: paths.filePath,
      week: ga.week,
      day: ga.day,
      dateKey: ga.dateKey,
      prompt,
      isCached: false,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    const fallback = await findLatestImage({
      storageRoot,
      safeUserKey: paths.safeUserKey,
    });

    if (fallback) {
      const stats = await getFileStats(fallback.filePath);
      return {
        url: fallback.publicUrl,
        filePath: fallback.filePath,
        week: fallback.metadata.week,
        day: fallback.metadata.day,
        dateKey: fallback.metadata.dateKey,
        prompt,
        isCached: true,
        createdAt: stats?.mtime?.toISOString?.() ?? null,
      };
    }

    const failure = new Error("Unable to create baby image");
    failure.code = "BABY_IMAGE_GENERATION_FAILED";
    failure.original = error;
    throw failure;
  }
};

module.exports = getOrCreateDailyBabyImage;
