const {
  generateDiscordMessage,
  getRandomTimestamp,
  loadImageBuffer,
} = require("./main.js");
const fs = require("fs");
const path = require("path");

describe("Discord Message Generator", () => {
  test("should generate a random timestamp", () => {
    const timestamp = getRandomTimestamp();
    const regex = /^([1-9]|1[0-2]):[0-5][0-9] (am|pm)$/;
    expect(timestamp).toMatch(regex);
  });

  test("should load image buffer from local file", async () => {
    const imagePath = path.resolve(__dirname, "./pfp.png");
    const buffer = await loadImageBuffer(imagePath);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  test("should load image buffer from URL", async () => {
    const url = "https://i.postimg.cc/Prhch3nx/image.png";
    const buffer = await loadImageBuffer(url);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  test("should generate a fake Discord message screenshot", async () => {
    const outputPath = "test/fake_discord_message.png";
    const result = await generateDiscordMessage({ outputPath });
    const fileExists = fs.existsSync(result);
    expect(fileExists).toBe(true);
  });
});
