require("dotenv").config();
const crypto = require("crypto");
const http = require("http");
const https = require("https");

function resolveUri(rawUri) {
  if (rawUri.startsWith("ipfs://")) {
    const cid = rawUri.replace("ipfs://", "");
    return `https://ipfs.io/ipfs/${cid}`;
  }
  return rawUri;
}

function fetchBuffer(url) {
  const client = url.startsWith("https://") ? https : http;
  const urlObj = new URL(url);
  const requestOptions = {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  };

  return new Promise((resolve, reject) => {
    client
      .get(urlObj, requestOptions, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }

        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function main() {
  const rawUri = process.argv[2] || process.env.MEDIA_URI;
  if (!rawUri) {
    throw new Error("Provide a URL argument or set MEDIA_URI in .env");
  }

  const url = resolveUri(rawUri);
  const buffer = await fetchBuffer(url);
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");

  console.log("SHA-256:", hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
