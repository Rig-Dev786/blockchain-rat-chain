require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const escrowAddress = process.env.RENTPROOF_ESCROW_ADDRESS;
  const agreementId = process.env.AGREEMENT_ID;
  const verdictType = process.env.VERDICT_TYPE;

  if (!escrowAddress) {
    throw new Error("RENTPROOF_ESCROW_ADDRESS is not set in .env");
  }
  if (!agreementId) {
    throw new Error("AGREEMENT_ID is not set in .env");
  }
  if (!verdictType) {
    throw new Error("VERDICT_TYPE is not set in .env");
  }

  const escrow = await hre.ethers.getContractAt("RentProofEscrow", escrowAddress);
  const tx = await escrow.releaseDepositFromVerdict(agreementId, verdictType);
  await tx.wait();

  console.log("Deposit released. Tx hash:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
