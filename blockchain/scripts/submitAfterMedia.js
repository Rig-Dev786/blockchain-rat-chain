require("dotenv").config();
const hre = require("hardhat");

function parseIds(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

async function main() {
  const escrowAddress = process.env.RENTPROOF_ESCROW_ADDRESS;
  const agreementId = process.env.AGREEMENT_ID;
  const afterMediaIds = parseIds(process.env.AFTER_MEDIA_IDS);

  if (!escrowAddress) {
    throw new Error("RENTPROOF_ESCROW_ADDRESS is not set in .env");
  }
  if (!agreementId) {
    throw new Error("AGREEMENT_ID is not set in .env");
  }
  if (afterMediaIds.length === 0) {
    throw new Error("AFTER_MEDIA_IDS must contain at least one media ID");
  }

  const escrow = await hre.ethers.getContractAt("RentProofEscrow", escrowAddress);
  const tx = await escrow.submitAfterMedia(agreementId, afterMediaIds);
  await tx.wait();

  console.log("After media submitted. Tx hash:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
