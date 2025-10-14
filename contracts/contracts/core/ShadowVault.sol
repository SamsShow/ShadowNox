// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ShadowVault
 * @notice Encrypted position storage for Shadow Nox
 * @dev All position data is stored as encrypted bytecode.
 * Decryption happens off-chain via Lit Protocol.
 */
contract ShadowVault {
    // Encrypted position data structure
    struct EncryptedPosition {
        bytes encryptedData; // Lit Protocol encrypted position details
        uint256 timestamp;   // Position creation/update time
        bool active;         // Position status
    }

    // User address => Position ID => Encrypted Position
    mapping(address => mapping(uint256 => EncryptedPosition)) private positions;
    
    // User address => Position count
    mapping(address => uint256) private positionCounts;

    // Events
    event PositionCreated(address indexed user, uint256 indexed positionId, uint256 timestamp);
    event PositionUpdated(address indexed user, uint256 indexed positionId, uint256 timestamp);
    event PositionClosed(address indexed user, uint256 indexed positionId, uint256 timestamp);

    error NotOwner();
    error PositionNotFound();
    error PositionNotActive();

    /**
     * @notice Create a new encrypted position for the message sender.
     * @param _encryptedData Lit Protocol encrypted position data.
     * @return The ID of the newly created position.
     */
    function createPosition(bytes calldata _encryptedData) external returns (uint256) {
        uint256 newPositionId = positionCounts[msg.sender]++;
        
        positions[msg.sender][newPositionId] = EncryptedPosition({
            encryptedData: _encryptedData,
            timestamp: block.timestamp,
            active: true
        });

        emit PositionCreated(msg.sender, newPositionId, block.timestamp);
        return newPositionId;
    }

    /**
     * @notice Update an existing encrypted position.
     * @param _positionId Position ID to update.
     * @param _encryptedData New encrypted data.
     */
    function updatePosition(uint256 _positionId, bytes calldata _encryptedData) external {
        EncryptedPosition storage position = positions[msg.sender][_positionId];

        if (position.timestamp == 0) { 
            revert PositionNotFound();
        }
        if (!position.active) {
            revert PositionNotActive();
        }

        position.encryptedData = _encryptedData;
        position.timestamp = block.timestamp;

        emit PositionUpdated(msg.sender, _positionId, block.timestamp);
    }

    /**
     * @notice Close a position, marking it as inactive.
     * @param _positionId Position ID to close.
     */
    function closePosition(uint256 _positionId) external {
        EncryptedPosition storage position = positions[msg.sender][_positionId];

        if (position.timestamp == 0) {
            revert PositionNotFound();
        }
        if (!position.active) {
            revert PositionNotActive();
        }

        position.active = false;
        
        emit PositionClosed(msg.sender, _positionId, block.timestamp);
    }

    /**
     * @notice Get encrypted position data for a specific user and position ID.
     * @param _user User address.
     * @param _positionId Position ID.
     * @return The encrypted position data.
     */
    function getPosition(address _user, uint256 _positionId) 
        external 
        view 
        returns (EncryptedPosition memory) 
    {
        EncryptedPosition storage position = positions[_user][_positionId];
        if (position.timestamp == 0) {
            revert PositionNotFound();
        }
        return position;
    }

    /**
     * @notice Get the total number of positions for a user.
     * @param _user The address to query.
     */
    function getPositionCount(address _user) external view returns (uint256) {
        return positionCounts[_user];
    }
}