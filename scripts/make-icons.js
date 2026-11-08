// Gera os ícones PNG do PWA a partir de public/icons/icon.svg (requer "sharp").
const sharp = require("sharp");
const fs = require("fs");
const svg = fs.readFileSync("public/icons/icon.svg");
const targets = [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]];
(async () => {
  for (const [name, size] of targets) {
    await sharp(svg, { density: 300 }).resize(size, size).png().toFile("public/icons/" + name);
  }
  // Versão "maskable": símbolo menor, com margem de segurança
  const inner = await sharp(svg, { density: 300 }).resize(360, 360).png().toBuffer();
  await sharp({ create: { width: 512, height: 512, channels: 4, background: "#101B35" } })
    .composite([{ input: inner, gravity: "center" }]).png().toFile("public/icons/icon-maskable-512.png");
})();
