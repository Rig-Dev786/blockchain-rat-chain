require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const registryAddress = process.env.MEDIA_REGISTRY_ADDRESS;
  const mediaUri = process.env.MEDIA_URI;
  const mediaType = process.env.MEDIA_TYPE;
  const mediaHash = process.env.MEDIA_HASH;

  if (!registryAddress) {
    throw new Error("MEDIA_REGISTRY_ADDRESS is not set in .env");
  }
  if (!mediaUri || !mediaType || !mediaHash) {
    throw new Error("MEDIA_URI, MEDIA_TYPE, and MEDIA_HASH must be set in .env");
  }

  const registry = await hre.ethers.getContractAt(
    "MediaRegistry",
    registryAddress
  );

  const tx = await registry.recordMedia(mediaUri, mediaType, mediaHash);
  const receipt = await tx.wait();

  const event = receipt.logs
    .map((log) => registry.interface.parseLog(log))
    .find((parsed) => parsed && parsed.name === "MediaRecorded");

  if (event) {
    console.log("Media recorded. ID:", event.args.id);
  } else {
    console.log("Media recorded. Tx hash:", tx.hash);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
