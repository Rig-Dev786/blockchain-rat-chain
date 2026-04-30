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
  const landlord = process.env.LANDLORD_ADDRESS;
  const beforeMediaIds = parseIds(process.env.BEFORE_MEDIA_IDS);
  const depositEth = process.env.DEPOSIT_ETH;

  if (!escrowAddress) {
    throw new Error("RENTPROOF_ESCROW_ADDRESS is not set in .env");
  }
  if (!landlord) {
    throw new Error("LANDLORD_ADDRESS is not set in .env");
  }
  if (beforeMediaIds.length === 0) {
    throw new Error("BEFORE_MEDIA_IDS must contain at least one media ID");
  }
  if (!depositEth) {
    throw new Error("DEPOSIT_ETH is not set in .env");
  }

  const escrow = await hre.ethers.getContractAt("RentProofEscrow", escrowAddress);
  const deposit = hre.ethers.parseEther(depositEth);

  const tx = await escrow.createAgreementWithMedia(landlord, beforeMediaIds, {
    value: deposit,
  });
  const receipt = await tx.wait();

  const event = receipt.logs
    .map((log) => escrow.interface.parseLog(log))
    .find((parsed) => parsed && parsed.name === "AgreementCreated");

  if (event) {
    console.log("Agreement created. ID:", event.args.id.toString());
  } else {
    console.log("Agreement created. Tx hash:", tx.hash);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
