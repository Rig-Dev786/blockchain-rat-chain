const hre = require("hardhat");

async function main() {
  console.log("Deploying RentProofEscrow...");
  const escrow = await hre.ethers.deployContract("RentProofEscrow");
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("RentProofEscrow deployed to:", escrowAddress);

  console.log("Deploying RentalAgreement...");
  const agreement = await hre.ethers.deployContract("RentalAgreement");
  await agreement.waitForDeployment();
  const agreementAddress = await agreement.getAddress();
  console.log("RentalAgreement deployed to:", agreementAddress);

  console.log("Deploying MediaRegistry...");
  const mediaRegistry = await hre.ethers.deployContract("MediaRegistry");
  await mediaRegistry.waitForDeployment();
  const mediaRegistryAddress = await mediaRegistry.getAddress();
  console.log("MediaRegistry deployed to:", mediaRegistryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});