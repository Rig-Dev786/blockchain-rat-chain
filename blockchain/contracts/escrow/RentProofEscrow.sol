// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RentProof Escrow Contract
/// @notice Locks tenant deposit and releases based on AI inspection verdict
contract RentProofEscrow {
    enum VerdictType { FULL_REFUND, PARTIAL_DEDUCTION, HOLD }
    enum AgreementStatus { CREATED, BEFORE_SUBMITTED, AFTER_SUBMITTED, SCORED, SETTLED }

    struct Agreement {
        address tenant;
        address landlord;
        uint256 deposit;
        bool active;
        bool settled;
        AgreementStatus status;
        bytes32[] beforeMediaIds;
        bytes32[] afterMediaIds;
        uint256 damageScore;
        uint256 deductionBps;
        string aiReportHash;
        uint256 tenureStart;
        uint256 tenureEnd;
        uint256 borrowedAmount;
        uint256 penaltyOwed;
        bool borrowingLocked;
    }

    mapping(uint256 => Agreement) public agreements;
    uint256 public agreementCount;
    address public owner;

    event AgreementCreated(uint256 indexed id, address tenant, address landlord, uint256 deposit);
    event DepositReleased(uint256 indexed id, VerdictType verdict, uint256 tenantAmount, uint256 landlordAmount);
    event BeforeMediaSubmitted(uint256 indexed id, uint256 count);
    event AfterMediaSubmitted(uint256 indexed id, uint256 count);
    event AIVerdictRecorded(uint256 indexed id, uint256 damageScore, uint256 deductionBps, string reportHash);
    event TenureSet(uint256 indexed id, uint256 start, uint256 end);
    event DepositBorrowed(uint256 indexed id, uint256 amount);
    event DepositRepaid(uint256 indexed id, uint256 amount, uint256 penaltyPaid);
    event PenaltyApplied(uint256 indexed id, uint256 amount);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    constructor() { owner = msg.sender; }

    function createAgreement(address _landlord) external payable returns (uint256) {
        require(msg.value > 0, "Deposit required");
        uint256 id = ++agreementCount;
        agreements[id] = Agreement({
            tenant: msg.sender,
            landlord: _landlord,
            deposit: msg.value,
            active: true,
            settled: false,
            status: AgreementStatus.CREATED,
            beforeMediaIds: new bytes32[](0),
            afterMediaIds: new bytes32[](0),
            damageScore: 0,
            deductionBps: 0,
            aiReportHash: "",
            tenureStart: 0,
            tenureEnd: 0,
            borrowedAmount: 0,
            penaltyOwed: 0,
            borrowingLocked: false
        });
        emit AgreementCreated(id, msg.sender, _landlord, msg.value);
        return id;
    }

    function createAgreementWithMedia(address _landlord, bytes32[] calldata _beforeMediaIds)
        external
        payable
        returns (uint256)
    {
        require(msg.value > 0, "Deposit required");
        require(_beforeMediaIds.length > 0, "Before media required");

        uint256 id = ++agreementCount;
        agreements[id] = Agreement({
            tenant: msg.sender,
            landlord: _landlord,
            deposit: msg.value,
            active: true,
            settled: false,
            status: AgreementStatus.BEFORE_SUBMITTED,
            beforeMediaIds: new bytes32[](0),
            afterMediaIds: new bytes32[](0),
            damageScore: 0,
            deductionBps: 0,
            aiReportHash: "",
            tenureStart: 0,
            tenureEnd: 0,
            borrowedAmount: 0,
            penaltyOwed: 0,
            borrowingLocked: false
        });

        _appendMedia(agreements[id].beforeMediaIds, _beforeMediaIds);
        emit AgreementCreated(id, msg.sender, _landlord, msg.value);
        emit BeforeMediaSubmitted(id, _beforeMediaIds.length);
        return id;
    }

    function submitBeforeMedia(uint256 _id, bytes32[] calldata _beforeMediaIds) external {
        Agreement storage a = agreements[_id];
        require(a.active && !a.settled, "Invalid state");
        require(msg.sender == a.tenant, "Not tenant");
        require(_beforeMediaIds.length > 0, "Before media required");

        _appendMedia(a.beforeMediaIds, _beforeMediaIds);
        a.status = AgreementStatus.BEFORE_SUBMITTED;
        emit BeforeMediaSubmitted(_id, _beforeMediaIds.length);
    }

    function submitAfterMedia(uint256 _id, bytes32[] calldata _afterMediaIds) external {
        Agreement storage a = agreements[_id];
        require(a.active && !a.settled, "Invalid state");
        require(msg.sender == a.tenant, "Not tenant");
        require(a.beforeMediaIds.length > 0, "Before media missing");
        require(_afterMediaIds.length > 0, "After media required");

        _appendMedia(a.afterMediaIds, _afterMediaIds);
        a.status = AgreementStatus.AFTER_SUBMITTED;
        emit AfterMediaSubmitted(_id, _afterMediaIds.length);
    }

    function recordAIVerdict(
        uint256 _id,
        uint256 _damageScore,
        uint256 _deductionBps,
        string calldata _reportHash
    ) external onlyOwner {
        Agreement storage a = agreements[_id];
        require(a.active && !a.settled, "Invalid state");
        require(a.status == AgreementStatus.AFTER_SUBMITTED, "After media required");
        require(_damageScore <= 100, "Damage score too high");
        require(_deductionBps <= 10000, "Deduction too high");

        a.damageScore = _damageScore;
        a.deductionBps = _deductionBps;
        a.aiReportHash = _reportHash;
        a.status = AgreementStatus.SCORED;

        emit AIVerdictRecorded(_id, _damageScore, _deductionBps, _reportHash);
    }

    function releaseDepositFromVerdict(uint256 _id, VerdictType _verdict) external onlyOwner {
        Agreement storage a = agreements[_id];
        require(a.status == AgreementStatus.SCORED, "Not scored");
        _releaseDeposit(_id, _verdict, a.deductionBps);
    }

    function setTenure(uint256 _id, uint256 _start, uint256 _end) external onlyOwner {
        Agreement storage a = agreements[_id];
        require(a.active && !a.settled, "Invalid state");
        require(_end > _start, "Invalid tenure");
        a.tenureStart = _start;
        a.tenureEnd = _end;
        emit TenureSet(_id, _start, _end);
    }

    function borrowDeposit(uint256 _id, uint256 _amount) external {
        Agreement storage a = agreements[_id];
        require(a.active && !a.settled, "Invalid state");
        require(msg.sender == a.landlord, "Not landlord");
        require(!a.borrowingLocked, "Borrowing locked");
        uint256 minBalance = minRequiredBalance(_id);
        uint256 available = a.deposit - a.borrowedAmount;
        require(available > minBalance, "Insufficient available balance");
        uint256 maxBorrow = available - minBalance;
        require(_amount > 0 && _amount <= maxBorrow, "Amount exceeds limit");

        a.borrowedAmount += _amount;
        payable(a.landlord).transfer(_amount);
        emit DepositBorrowed(_id, _amount);
    }

    function repayDeposit(uint256 _id) external payable {
        Agreement storage a = agreements[_id];
        require(a.active && !a.settled, "Invalid state");
        require(msg.sender == a.landlord, "Not landlord");
        require(msg.value > 0, "No value sent");

        uint256 penaltyPaid = 0;
        if (a.penaltyOwed > 0) {
            uint256 pay = msg.value >= a.penaltyOwed ? a.penaltyOwed : msg.value;
            a.penaltyOwed -= pay;
            penaltyPaid = pay;
        }

        uint256 remaining = msg.value - penaltyPaid;
        if (remaining > 0) {
            if (remaining >= a.borrowedAmount) {
                a.borrowedAmount = 0;
            } else {
                a.borrowedAmount -= remaining;
            }
        }

        if (a.penaltyOwed == 0 && (a.deposit - a.borrowedAmount) >= minRequiredBalance(_id)) {
            a.borrowingLocked = false;
        }

        emit DepositRepaid(_id, msg.value, penaltyPaid);
    }

    function enforceMinimum(uint256 _id) external {
        Agreement storage a = agreements[_id];
        require(a.active && !a.settled, "Invalid state");
        uint256 minBalance = minRequiredBalance(_id);
        uint256 currentBalance = a.deposit - a.borrowedAmount;
        if (currentBalance < minBalance) {
            uint256 penalty = (a.deposit * 200) / 10000;
            a.penaltyOwed += penalty;
            a.borrowingLocked = true;
            emit PenaltyApplied(_id, penalty);
        }
    }

    function minRequiredBalance(uint256 _id) public view returns (uint256) {
        Agreement storage a = agreements[_id];
        require(a.tenureEnd > a.tenureStart, "Tenure not set");
        if (block.timestamp <= a.tenureStart) {
            return (a.deposit * 1000) / 10000;
        }
        if (block.timestamp >= a.tenureEnd) {
            return (a.deposit * 9000) / 10000;
        }

        uint256 elapsed = block.timestamp - a.tenureStart;
        uint256 duration = a.tenureEnd - a.tenureStart;
        uint256 minBps = 1000 + ((8000 * elapsed) / duration);
        return (a.deposit * minBps) / 10000;
    }

    function releaseDeposit(uint256 _id, VerdictType _verdict, uint256 _deductionBps) external onlyOwner {
        _releaseDeposit(_id, _verdict, _deductionBps);
    }

    function _releaseDeposit(uint256 _id, VerdictType _verdict, uint256 _deductionBps) internal {
        Agreement storage a = agreements[_id];
        require(a.active && !a.settled, "Invalid state");
        require(_deductionBps <= 10000, "Deduction too high");
        require(a.borrowedAmount == 0, "Outstanding borrowed balance");
        require(a.penaltyOwed == 0, "Outstanding penalty");
        a.settled = true;
        a.status = AgreementStatus.SETTLED;

        uint256 deduction = (a.deposit * _deductionBps) / 10000;
        uint256 tenantAmount = a.deposit - deduction;

        if (tenantAmount > 0) payable(a.tenant).transfer(tenantAmount);
        if (deduction > 0) payable(a.landlord).transfer(deduction);

        emit DepositReleased(_id, _verdict, tenantAmount, deduction);
    }

    function _appendMedia(bytes32[] storage _dest, bytes32[] calldata _src) internal {
        for (uint256 i = 0; i < _src.length; i++) {
            _dest.push(_src[i]);
        }
    }
}
