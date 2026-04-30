// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RentalAgreement {
    address public owner;

    struct Verdict {
        string result;        // "FULL REFUND", "PARTIAL", "DEPOSIT HELD"
        uint256 damageScore;  // 0-100
        string videoHash;     // SHA-256 hash of the video
        string signedVerdict; // HMAC signature from backend
        uint256 timestamp;
    }

    mapping(string => Verdict) public verdicts; // videoHash => Verdict

    event VerdictRecorded(
        string videoHash,
        string result,
        uint256 damageScore,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function recordVerdict(
        string memory videoHash,
        string memory result,
        uint256 damageScore,
        string memory signedVerdict
    ) external onlyOwner {
        verdicts[videoHash] = Verdict({
            result: result,
            damageScore: damageScore,
            videoHash: videoHash,
            signedVerdict: signedVerdict,
            timestamp: block.timestamp
        });

        emit VerdictRecorded(videoHash, result, damageScore, block.timestamp);
    }

    function getVerdict(string memory videoHash)
        external
        view
        returns (string memory, uint256, string memory, uint256)
    {
        Verdict memory v = verdicts[videoHash];
        return (v.result, v.damageScore, v.signedVerdict, v.timestamp);
    }
}