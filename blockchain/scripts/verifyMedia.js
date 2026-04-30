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
  const requestOptions = {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  };

  return new Promise((resolve, reject) => {
    client
      .get(url, requestOptions, (res) => {
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
  const rawUri = process.env.MEDIA_URI;
  const expectedHash = process.env.MEDIA_HASH;

  if (!rawUri || !expectedHash) {
    throw new Error("MEDIA_URI and MEDIA_HASH must be set in .env");
  }

  const url = resolveUri(rawUri);
  const buffer = await fetchBuffer(url);
  const actualHash = crypto.createHash("sha256").update(buffer).digest("hex");

  if (actualHash.toLowerCase() === expectedHash.toLowerCase()) {
    console.log("Hash verified. Media matches on-chain hash.");
  } else {
    console.log("Hash mismatch!");
    console.log("Expected:", expectedHash);
    console.log("Actual:  ", actualHash);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
