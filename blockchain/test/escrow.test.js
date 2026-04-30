const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RentProofEscrow", () => {
  let escrow, owner, tenant, landlord;

  beforeEach(async () => {
    [owner, tenant, landlord] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory("RentProofEscrow");
    escrow = await Escrow.deploy();
  });

  it("should create agreement and lock deposit", async () => {
    const deposit = ethers.parseEther("1.0");
    await escrow.connect(tenant).createAgreement(landlord.address, { value: deposit });
    const agreement = await escrow.agreements(1);
    expect(agreement.deposit).to.equal(deposit);
  });
});
