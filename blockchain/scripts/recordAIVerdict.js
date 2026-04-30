require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const escrowAddress = process.env.RENTPROOF_ESCROW_ADDRESS;
  const agreementId = process.env.AGREEMENT_ID;
  const damageScore = process.env.DAMAGE_SCORE;
  const deductionBps = process.env.DEDUCTION_BPS;
  const reportHash = process.env.AI_REPORT_HASH || "";

  if (!escrowAddress) {
    throw new Error("RENTPROOF_ESCROW_ADDRESS is not set in .env");
  }
  if (!agreementId) {
    throw new Error("AGREEMENT_ID is not set in .env");
  }
  if (damageScore === undefined || deductionBps === undefined) {
    throw new Error("DAMAGE_SCORE and DEDUCTION_BPS must be set in .env");
  }

  const escrow = await hre.ethers.getContractAt("RentProofEscrow", escrowAddress);
  const tx = await escrow.recordAIVerdict(
    agreementId,
    Number(damageScore),
    Number(deductionBps),
    reportHash
  );
  await tx.wait();

  console.log("AI verdict recorded. Tx hash:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
