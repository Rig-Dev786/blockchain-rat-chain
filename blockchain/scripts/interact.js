const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.RENTAL_AGREEMENT_ADDRESS;
  if (!contractAddress) {
    throw new Error("RENTAL_AGREEMENT_ADDRESS is not set in .env");
  }

  const contract = await hre.ethers.getContractAt(
    "RentalAgreement",
    contractAddress
  );

  // Record a test verdict
  const tx = await contract.recordVerdict(
    "abc123videohash",
    "DEPOSIT HELD",
    78,
    "hmac_signature_here"
  );
  await tx.wait();
  console.log("Verdict recorded. Tx hash:", tx.hash);

  // Read it back
  const verdict = await contract.getVerdict("abc123videohash");
  console.log("Result:", verdict[0]);
  console.log("Damage score:", verdict[1].toString());
  console.log("Timestamp:", verdict[3].toString());
}

main().catch(console.error);