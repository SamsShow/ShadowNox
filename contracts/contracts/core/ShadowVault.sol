// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ShadowVault
 * @notice Private position storage for Shadow Economy on Arcology
 * @dev Position metadata stored as bytes on-chain for privacy-preserving execution
 * 
 * Deployed on Arcology Parallel Blockchain:
 * - Stores position metadata as arbitrary bytes
 * - Position data stored on-chain
 * - Privacy via intent relay architecture (future)
 * - Parallel execution for position CRUD operations
 * 
 * Privacy Model:
 * - Position data (balances, assets, values): Stored as bytes on-chain
 * - Position count: PUBLIC (on-chain reference)
 * - Smart contract logic: PUBLIC (Solidity on Arcology)
 * 
 * Data Format: ABI-encoded position info (asset, amount, entryPrice, timestamp)
 */
contract ShadowVault {
    // Private position data structure
    struct Position {
        bytes positionData;  // ABI-encoded position details (asset, amount, entryPrice, timestamp)
        uint256 timestamp;   // Position creation/update time
        bool active;         // Position status
    }

    // User address => Position ID => Position
    mapping(address => mapping(uint256 => Position)) private positions;
    
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
     * @notice Create a new private position for the message sender.
     * @param _positionData ABI-encoded position data (asset, amount, entryPrice, timestamp).
     * @return The ID of the newly created position.
     */
    function createPosition(bytes calldata _positionData) external returns (uint256) {
        uint256 newPositionId = positionCounts[msg.sender]++;
        
        positions[msg.sender][newPositionId] = Position({
            positionData: _positionData,
            timestamp: block.timestamp,
            active: true
        });

        emit PositionCreated(msg.sender, newPositionId, block.timestamp);
        return newPositionId;
    }

    /**
     * @notice Update an existing private position.
     * @param _positionId Position ID to update.
     * @param _positionData New position data.
     */
    function updatePosition(uint256 _positionId, bytes calldata _positionData) external {
        Position storage position = positions[msg.sender][_positionId];

        if (position.timestamp == 0) { 
            revert PositionNotFound();
        }
        if (!position.active) {
            revert PositionNotActive();
        }

        position.positionData = _positionData;
        position.timestamp = block.timestamp;

        emit PositionUpdated(msg.sender, _positionId, block.timestamp);
    }

    /**
     * @notice Close a position, marking it as inactive.
     * @param _positionId Position ID to close.
     */
    function closePosition(uint256 _positionId) external {
        Position storage position = positions[msg.sender][_positionId];

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
     * @notice Get position data for a specific user and position ID.
     * @param _user User address.
     * @param _positionId Position ID.
     * @return The position data.
     */
    function getPosition(address _user, uint256 _positionId) 
        external 
        view 
        returns (Position memory) 
    {
        Position storage position = positions[_user][_positionId];
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