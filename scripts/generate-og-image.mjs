import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const inputPath = path.join(root, "public/images/ferry-landing.webp");
const outputPath = path.join(root, "public/images/og-portoferry-v2.jpg");

const overlay = Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="leftShade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#030a10" stop-opacity="0.78" />
        <stop offset="0.58" stop-color="#030a10" stop-opacity="0.5" />
        <stop offset="1" stop-color="#030a10" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="bottomShade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#030a10" stop-opacity="0" />
        <stop offset="1" stop-color="#030a10" stop-opacity="0.35" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#leftShade)" />
    <rect width="1200" height="630" fill="url(#bottomShade)" />
    <text x="68" y="78" fill="#d5ecfa" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="700">portoferry.</text>
    <text x="68" y="267" fill="#f5f8fb" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="400">Website siap.</text>
    <text x="68" y="344" fill="#b7dcf3" font-family="Georgia, Times New Roman, serif" font-size="70" font-style="italic" font-weight="700">Bisnis jalan.</text>
    <text x="70" y="405" fill="#c3d4df" font-family="Arial, Helvetica, sans-serif" font-size="20" letter-spacing="0.4">Web Development · IT Consulting · Video Editing</text>
    <text x="70" y="556" fill="#c3d4df" font-family="Arial, Helvetica, sans-serif" font-size="14" letter-spacing="2.5">FERRY KURNIAWAN / PORTOFERRY.MY.ID</text>
  </svg>
`);

await sharp(inputPath)
  .resize(1200, 630, { fit: "cover", position: "center" })
  .composite([{ input: overlay }])
  .jpeg({ quality: 90, progressive: true, mozjpeg: true })
  .toFile(outputPath);

console.log(`Generated ${path.relative(root, outputPath)} from ${path.relative(root, inputPath)}`);
