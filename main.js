const fs = require("fs");
const { createCanvas } = require("canvas");
const sharp = require("sharp");
const path = require("path");
const { fileURLToPath } = require("url");
const fetch = require("node-fetch");

/**
 * Resolves a file input path, converting it to a local file path if it is a file URL.
 * If the input path is an HTTP URL, it returns the URL unchanged.
 * For any other path formats, it returns the input path as is.
 *
 * @param {string} inputPath - The path to resolve, can be a file URL, HTTP URL, or a local path.
 * @returns {string} - The resolved file path.
 * @throws {Error} - If there is an error resolving the file input path.
 */

function resolveFileInput(inputPath) {
  try {
    if (inputPath.startsWith("file://")) {
      return fileURLToPath(inputPath);
    } else if (inputPath.startsWith("http")) {
      return inputPath;
    }
    return inputPath;
  } catch (error) {
    throw new Error(`Error resolving file input path: ${error.message}`);
  }
}

/**
 * Loads an image from a URL or a local file path and returns its buffer.
 *
 * @param {string} inputPath - The URL or local file path of the image to load.
 * @returns {Promise<Buffer>} - The image buffer.
 * @throws {Error} - If there is an error loading the image.
 */
async function loadImageBuffer(inputPath) {
  try {
    const resolved = resolveFileInput(inputPath);
    if (resolved.startsWith("http")) {
      const res = await fetch(resolved);
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    }
    return fs.promises.readFile(resolved);
  } catch (error) {
    throw new Error(`Error loading image buffer: ${error.message}`);
  }
}

/**
 * Generates a random timestamp in the format "X:YY am/pm" where X is an hour between 1-12 and YY is a minute between 0-59.
 * @returns {string} - The random timestamp.
 * @throws {Error} - If there is an error generating the random timestamp.
 */
function getRandomTimestamp() {
  try {
    const hour = Math.floor(Math.random() * 12) + 1;
    const minute = Math.floor(Math.random() * 60);
    const isPM = Math.random() > 0.5;
    const formattedMinute = minute.toString().padStart(2, "0");
    const period = isPM ? "pm" : "am";
    return `${hour}:${formattedMinute} ${period}`;
  } catch (error) {
    throw new Error(`Error generating random timestamp: ${error.message}`);
  }
}

/**
 * Generates a fake Discord message screenshot.
 *
 * @param {Object} options - The options to use when generating the fake Discord message.
 * @param {string} [options.pfpPath="https://i.postimg.cc/Prhch3nx/image.png"] - The URL or local file path of the user's profile picture.
 * @param {string} [options.outputPath="fake_discord_message.png"] - The path where the generated screenshot will be saved.
 * @param {string} [options.username="Ethanol"] - The username to display.
 * @param {string} [options.timestamp] - The timestamp to display. If not provided, a random one is generated.
 * @param {string} [options.message="C'est la vie"] - The message content.
 * @param {string} [options.backgroundColor] - The background color of the message box.
 * @param {string} [options.usernameColor] - The color of the username text.
 * @param {string} [options.timestampColor] - The color of the timestamp text.
 * @param {string} [options.messageColor] - The color of the message text.
 * @param {number} [options.timestampXOffset] - The horizontal offset for the timestamp (helpful for aligning with longer usernames).
 * @returns {Promise<string>} - The path to the generated screenshot.
 * @throws {Error} - If there is an error generating the fake Discord message.
 */
async function generateDiscordMessage({
  pfpPath = "https://i.postimg.cc/Prhch3nx/image.png",
  outputPath = "fake_discord_message.png",
  username = "Ethanol",
  timestamp,
  message = "C'est la vie",
  backgroundColor,
  usernameColor,
  timestampColor,
  messageColor,
  timestampXOffset,
} = {}) {
  try {
    const WIDTH = 500;
    const HEIGHT = 80;
    const AVATAR_SIZE = 52;
    const SCALE = 4;

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const canvas = createCanvas(WIDTH * SCALE, HEIGHT * SCALE);
    const ctx = canvas.getContext("2d");
    ctx.scale(SCALE, SCALE);

    ctx.fillStyle = backgroundColor || "#2b2d31";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = usernameColor || "white";
    ctx.fillText(username, 73, 32);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = timestampColor || "#83838b";
    ctx.fillText(
      timestamp || getRandomTimestamp(),
      70 + ctx.measureText(username).width + (timestampXOffset || 35),
      32
    );

    ctx.font = "16px sans-serif";
    ctx.fillStyle = messageColor || "#efeff0";
    ctx.fillText(message, 73, 55);

    const backgroundBuffer = canvas.toBuffer();

    const circleMask = Buffer.from(
      `<svg width="${AVATAR_SIZE}" height="${AVATAR_SIZE}">
        <circle cx="${AVATAR_SIZE / 2}" cy="${AVATAR_SIZE / 2}" r="${
        AVATAR_SIZE / 2
      }" fill="white"/>
      </svg>`
    );

    const avatarBuffer = await loadImageBuffer(pfpPath);

    const circularAvatar = await sharp(avatarBuffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE)
      .composite([{ input: circleMask, blend: "dest-in" }])
      .png()
      .toBuffer();

    await sharp(backgroundBuffer, { density: 144 })
      .resize(WIDTH, HEIGHT)
      .composite([
        {
          input: circularAvatar,
          top: 14,
          left: 10,
        },
      ])
      .png()
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    throw new Error(`Error generating Discord message: ${error.message}`);
  }
}

module.exports = {
  generateDiscordMessage,
  getRandomTimestamp,
  resolveFileInput,
  loadImageBuffer,
};
