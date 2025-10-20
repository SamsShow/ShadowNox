// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ConcurrentStorage
 * @notice Optimized storage patterns for Arcology parallel blockchain execution
 * @dev Design patterns for minimizing storage-slot conflicts on Arcology
 * 
 * Arcology Parallel Execution Model:
 * - Detects conflicts at storage-slot level
 * - Transactions accessing different slots execute in parallel
 * - Conflicting transactions automatically retried
 * - No manual locking required
 * 
 * Best Practices for Arcology:
 * 1. Per-user storage isolation (different addresses = different slots)
 * 2. Minimize global state variables
 * 3. Use mapping over arrays for parallel access
 * 4. Batch aggregate updates to reduce conflicts
 * 
 * Storage Layout Optimization:
 * - Pack related variables in same slot
 * - Keep frequently-updated variables in separate slots
 * - Use per-user mappings for maximum parallelism
 */
library ConcurrentStorage {
    
    /**
     * @notice Calculate optimal storage slot for user-specific data
     * @dev Each user gets isolated storage slot for conflict-free parallel execution
     * @param user User address
     * @param dataId Unique identifier for data type
     * @return slot Calculated storage slot
     */
    function getUserSlot(address user, bytes32 dataId) internal pure returns (bytes32 slot) {
        return keccak256(abi.encodePacked(user, dataId));
    }

    /**
     * @notice Store uint256 value in user-specific slot
     * @param user User address
     * @param dataId Data identifier
     * @param value Value to store
     */
    function setUserValue(address user, bytes32 dataId, uint256 value) internal {
        bytes32 slot = getUserSlot(user, dataId);
        assembly {
            sstore(slot, value)
        }
    }

    /**
     * @notice Retrieve uint256 value from user-specific slot
     * @param user User address
     * @param dataId Data identifier
     * @return value Stored value
     */
    function getUserValue(address user, bytes32 dataId) internal view returns (uint256 value) {
        bytes32 slot = getUserSlot(user, dataId);
        assembly {
            value := sload(slot)
        }
    }

    /**
     * @notice Increment user-specific counter atomically
     * @dev Optimized for Arcology parallel execution
     * @param user User address
     * @param dataId Counter identifier
     * @param delta Amount to increment
     * @return newValue New counter value
     */
    function incrementUserCounter(
        address user, 
        bytes32 dataId, 
        uint256 delta
    ) internal returns (uint256 newValue) {
        bytes32 slot = getUserSlot(user, dataId);
        uint256 currentValue;
        
        assembly {
            currentValue := sload(slot)
            newValue := add(currentValue, delta)
            
            // Check overflow (newValue should be >= currentValue)
            if lt(newValue, currentValue) {
                revert(0, 0)
            }
            
            sstore(slot, newValue)
        }
        
        return newValue;
    }

    /**
     * @notice Batch update multiple user values
     * @dev Efficient batch operation for Arcology
     * @param users Array of user addresses
     * @param dataIds Array of data identifiers
     * @param values Array of values to store
     */
    function batchSetUserValues(
        address[] memory users,
        bytes32[] memory dataIds,
        uint256[] memory values
    ) internal {
        require(
            users.length == dataIds.length && dataIds.length == values.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < users.length; i++) {
            setUserValue(users[i], dataIds[i], values[i]);
        }
    }

    /**
     * @notice Check if storage slot is empty
     * @param slot Storage slot to check
     * @return isEmpty True if slot is empty
     */
    function isSlotEmpty(bytes32 slot) internal view returns (bool isEmpty) {
        uint256 value;
        assembly {
            value := sload(slot)
        }
        return value == 0;
    }

    /**
     * @notice Calculate conflict probability for shared storage access
     * @dev Estimation tool for Arcology optimization
     * @param uniqueAddresses Number of unique addresses accessing storage
     * @param totalSlots Total storage slots being accessed
     * @return conflictRate Estimated conflict rate (0-100)
     */
    function estimateConflictRate(
        uint256 uniqueAddresses,
        uint256 totalSlots
    ) internal pure returns (uint256 conflictRate) {
        if (totalSlots == 0 || uniqueAddresses == 0) {
            return 0;
        }
        
        // Simplified conflict estimation
        // More unique slots per address = lower conflict rate
        if (totalSlots >= uniqueAddresses) {
            conflictRate = (uniqueAddresses * 100) / totalSlots;
        } else {
            conflictRate = 100;
        }
        
        return conflictRate;
    }
}

/**
 * @title PerUserStorage
 * @notice Abstract contract implementing per-user storage pattern for Arcology
 * @dev Inherit this for optimal parallel execution on Arcology
 */
abstract contract PerUserStorage {
    using ConcurrentStorage for address;

    // Per-user data counters
    mapping(address => uint256) internal userDataCount;

    /**
     * @notice Get user-specific data count
     * @param user User address
     * @return count Number of data entries for user
     */
    function getUserDataCount(address user) public view returns (uint256 count) {
        return userDataCount[user];
    }

    /**
     * @notice Increment user data count
     * @dev Internal function for derived contracts
     * @param user User address
     */
    function _incrementUserDataCount(address user) internal {
        userDataCount[user]++;
    }

    /**
     * @notice Check if user has data
     * @param user User address
     * @return hasData True if user has stored data
     */
    function _userHasData(address user) internal view returns (bool hasData) {
        return userDataCount[user] > 0;
    }
}


