// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RentProof Escrow Contract
/// @notice Locks tenant deposit and releases based on AI inspection verdict
contract RentProofEscrow {
    enum VerdictType { FULL_REFUND, PARTIAL_DEDUCTION, HOLD }

    struct Agreement {
        address tenant;
        address landlord;
        uint256 deposit;
        bool active;
        bool settled;
    }

    mapping(uint256 => Agreement) public agreements;
    uint256 public agreementCount;
    address public owner;

    event AgreementCreated(uint256 indexed id, address tenant, address landlord, uint256 deposit);
    event DepositReleased(uint256 indexed id, VerdictType verdict, uint256 tenantAmount, uint256 landlordAmount);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    constructor() { owner = msg.sender; }

    function createAgreement(address _landlord) external payable returns (uint256) {
        require(msg.value > 0, "Deposit required");
        uint256 id = ++agreementCount;
        agreements[id] = Agreement(msg.sender, _landlord, msg.value, true, false);
        emit AgreementCreated(id, msg.sender, _landlord, msg.value);
        return id;
    }

    function releaseDeposit(uint256 _id, VerdictType _verdict, uint256 _deductionBps) external onlyOwner {
        Agreement storage a = agreements[_id];
        require(a.active && !a.settled, "Invalid state");
        a.settled = true;

        uint256 deduction = (a.deposit * _deductionBps) / 10000;
        uint256 tenantAmount = a.deposit - deduction;

        if (tenantAmount > 0) payable(a.tenant).transfer(tenantAmount);
        if (deduction > 0) payable(a.landlord).transfer(deduction);

        emit DepositReleased(_id, _verdict, tenantAmount, deduction);
    }
}
