// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Media Registry
/// @notice Stores media references and hashes on-chain; files stay off-chain
contract MediaRegistry {
    struct MediaItem {
        string uri;
        string mediaType;
        string contentHash;
        uint256 timestamp;
        address uploader;
    }

    mapping(bytes32 => MediaItem) public mediaById;

    event MediaRecorded(
        bytes32 indexed id,
        string uri,
        string mediaType,
        string contentHash,
        address uploader,
        uint256 timestamp
    );

    function recordMedia(
        string memory uri,
        string memory mediaType,
        string memory contentHash
    ) external returns (bytes32) {
        bytes32 id = keccak256(abi.encodePacked(contentHash, msg.sender, block.timestamp));
        mediaById[id] = MediaItem({
            uri: uri,
            mediaType: mediaType,
            contentHash: contentHash,
            timestamp: block.timestamp,
            uploader: msg.sender
        });

        emit MediaRecorded(id, uri, mediaType, contentHash, msg.sender, block.timestamp);
        return id;
    }
}
