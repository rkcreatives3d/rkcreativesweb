// Serves the built site (./out) the way a static host would: /shop/ →
// /shop/index.html, unknown paths → 404.html, text compressed with brotli /
// gzip, and the same caching and security headers as vercel.json. Used for
// local previews and tests, and good enough to run the site on a plain Node
// host (e.g. a Render "Web Service": `npm start`, which listens on $PORT).
// No dependencies.
//   node scripts/serve.mjs [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = path.resolve("out");
const port = Number(process.argv[2] || process.env.PORT || 3000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
  ".mp4": "video/mp4",
};

const security = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), xr-spatial-tracking=(self)",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
};
const cacheFor = (url) =>
  url.startsWith("/_next/static/")
    ? "public, max-age=31536000, immutable"
    : /^\/(brand|renders|vendor|models|og)\//.test(url)
      ? "public, max-age=604800, stale-while-revalidate=86400"
      : "no-cache";

const packed = new Map();

if (!fs.existsSync(root)) {
  console.error("No ./out folder. Run `npm run build` first.");
  process.exit(1);
}

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    let file = path.join(root, url);
    if (!file.startsWith(root)) return res.writeHead(403, security).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!url.endsWith("/")) return res.writeHead(308, { ...security, Location: url + "/" }).end();
      file = path.join(file, "index.html");
    }
    let status = 200;
    if (!fs.existsSync(file)) {
      status = 404;
      file = path.join(root, "404.html");
    }
    const type = types[path.extname(file)] || "application/octet-stream";
    const cache = cacheFor(url);
    const accept = String(req.headers["accept-encoding"] || "");
    const text = /^(text\/|application\/(json|xml)|image\/svg)/.test(type);
    const enc = text ? (/\bbr\b/.test(accept) ? "br" : /\bgzip\b/.test(accept) ? "gzip" : "") : "";
    res.writeHead(status, { ...security, "Content-Type": type, "Cache-Control": cache, Vary: "Accept-Encoding", ...(enc ? { "Content-Encoding": enc } : {}) });
    if (!enc) return fs.createReadStream(file).pipe(res);
    // compress each file once and keep it, like a CDN would
    const key = `${enc}:${file}:${fs.statSync(file).mtimeMs}`;
    let out = packed.get(key);
    if (!out) {
      const raw = fs.readFileSync(file);
      out = enc === "br" ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } }) : zlib.gzipSync(raw, { level: 9 });
      packed.set(key, out);
    }
    res.end(out);
  })
  .listen(port, () => console.log(`Serving ./out on port ${port}`));
