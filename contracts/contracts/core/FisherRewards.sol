// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../arcology/AtomicCounter.sol";

/**
 * @title FisherRewards
 * @notice Reward system for EVVM Fisher bots relaying transactions to Arcology
 * @dev Tracks and distributes rewards to Fisher bots for transaction execution
 * 
 * EVVM Fisher Bot Model:
 * - Fisher bots relay user transactions to Arcology blockchain
 * - Bots earn rewards for providing gasless UX to users
 * - Reward calculation based on gas costs, complexity, and network demand
 * - Anti-spam and anti-gaming protection mechanisms
 * 
 * BOT INTEGRATION: Core contract for Fisher bot incentive system
 * - recordReward: Called by EncryptedSwap/other contracts after execution
 * - claimRewards: Fisher bots call this to claim accumulated rewards
 * - getRewardStats: Query bot performance and earnings
 * 
 * Arcology Optimization:
 * - Per-Fisher isolated storage for parallel execution
 * - AtomicCounter for global reward pool tracking
 * - Batch claim support for efficiency
 */
contract FisherRewards {
    address public owner;
    address public rewardToken; // Address of reward token (0x0 for native token)
    
    // Fisher bot reward tracking
    struct FisherStats {
        uint256 totalRewards;
        uint256 pendingRewards;
        uint256 claimedRewards;
        uint256 transactionCount;
        uint256 lastClaimTime;
        bool isActive;
    }
    
    // Per-Fisher stats (isolated for Arcology parallelism)
    mapping(address => FisherStats) private fisherStats;
    
    // Transaction hash => Fisher address (for reward attribution)
    mapping(bytes32 => address) private txHashToFisher;
    
    // Global reward pool tracking
    AtomicCounter public totalRewardPool;
    AtomicCounter public totalRewardsPaid;
    uint256 public minClaimAmount;
    uint256 public claimCooldown;
    
    // Reward calculation parameters
    uint256 public baseRewardRate; // Base reward per transaction
    uint256 public gasMultiplier; // Multiplier for gas costs
    uint256 public complexityBonus; // Bonus for complex transactions
    
    // Events
    event RewardRecorded(address indexed fisher, bytes32 indexed txHash, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed fisher, uint256 amount, uint256 timestamp);
    event FisherRegistered(address indexed fisher, uint256 timestamp);
    event RewardPoolFunded(uint256 amount, uint256 timestamp);
    event RewardParametersUpdated(uint256 baseRate, uint256 gasMultiplier, uint256 complexityBonus);
    
    error NotOwner();
    error InsufficientRewardPool();
    error ClaimCooldownActive();
    error BelowMinClaimAmount();
    error NoRewardsToClaim();
    error FisherNotActive();
    error InvalidParameters();

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        
        // Initialize AtomicCounters
        totalRewardPool = new AtomicCounter();
        totalRewardsPaid = new AtomicCounter();
        
        // Default parameters
        minClaimAmount = 0.001 ether; // Minimum 0.001 ETH to claim
        claimCooldown = 1 hours; // 1 hour between claims
        baseRewardRate = 0.0001 ether; // Base reward per transaction
        gasMultiplier = 1; // 1:1 gas to reward ratio
        complexityBonus = 0.0001 ether; // Bonus for complex txs
    }

    /**
     * @notice Register as a Fisher bot
     * @dev BOT INTEGRATION: Fisher bots should call this before relaying transactions
     */
    function registerFisher() external {
        FisherStats storage stats = fisherStats[msg.sender];
        
        if (!stats.isActive) {
            stats.isActive = true;
            stats.lastClaimTime = 0; // Allow immediate first claim
            emit FisherRegistered(msg.sender, block.timestamp);
        }
    }

    /**
     * @notice Record reward for a Fisher bot after transaction execution
     * @dev Called by authorized contracts (EncryptedSwap, etc.)
     * @param _fisher Address of Fisher bot that relayed the transaction
     * @param _txHash Transaction hash for tracking
     * @param _gasUsed Gas consumed by the transaction
     * @param _complexity Complexity score (0-100)
     */
    function recordReward(
        address _fisher,
        bytes32 _txHash,
        uint256 _gasUsed,
        uint256 _complexity
    ) external returns (uint256 rewardAmount) {
        // In production, add access control to only allow authorized contracts
        // For now, we'll allow the owner to record rewards
        require(msg.sender == owner, "Only authorized contracts");
        
        FisherStats storage stats = fisherStats[_fisher];
        if (!stats.isActive) {
            revert FisherNotActive();
        }
        
        // Calculate reward based on gas and complexity
        rewardAmount = calculateReward(_gasUsed, _complexity);
        
        // Check reward pool has sufficient funds
        if (totalRewardPool.current() < rewardAmount) {
            revert InsufficientRewardPool();
        }
        
        // Update Fisher stats
        stats.totalRewards += rewardAmount;
        stats.pendingRewards += rewardAmount;
        stats.transactionCount++;
        
        // Track transaction attribution
        txHashToFisher[_txHash] = _fisher;
        
        emit RewardRecorded(_fisher, _txHash, rewardAmount, block.timestamp);
        return rewardAmount;
    }

    /**
     * @notice Calculate reward for a transaction
     * @param _gasUsed Gas consumed
     * @param _complexity Complexity score (0-100)
     * @return reward Calculated reward amount
     */
    function calculateReward(uint256 _gasUsed, uint256 _complexity) public view returns (uint256 reward) {
        // Base reward
        reward = baseRewardRate;
        
        // Add gas-based reward (scale by gasMultiplier and normalize)
        reward += (_gasUsed * gasMultiplier) / 1e5; // Adjusted for better scaling
        
        // Add complexity bonus
        if (_complexity > 50) {
            reward += complexityBonus;
        }
        
        return reward;
    }

    /**
     * @notice Claim pending rewards
     * @dev BOT INTEGRATION: Fisher bots call this to withdraw earnings
     */
    function claimRewards() external {
        FisherStats storage stats = fisherStats[msg.sender];
        
        if (!stats.isActive) {
            revert FisherNotActive();
        }
        
        if (stats.pendingRewards == 0) {
            revert NoRewardsToClaim();
        }
        
        if (stats.pendingRewards < minClaimAmount) {
            revert BelowMinClaimAmount();
        }
        
        if (block.timestamp < stats.lastClaimTime + claimCooldown) {
            revert ClaimCooldownActive();
        }
        
        uint256 claimAmount = stats.pendingRewards;
        
        // Check reward pool
        if (totalRewardPool.current() < claimAmount) {
            revert InsufficientRewardPool();
        }
        
        // Update stats
        stats.pendingRewards = 0;
        stats.claimedRewards += claimAmount;
        stats.lastClaimTime = block.timestamp;
        
        // Update global counters
        totalRewardPool.decrement(claimAmount);
        totalRewardsPaid.increment(claimAmount);
        
        // Transfer rewards (native token)
        (bool success, ) = msg.sender.call{value: claimAmount}("");
        require(success, "Transfer failed");
        
        emit RewardsClaimed(msg.sender, claimAmount, block.timestamp);
    }

    /**
     * @notice Get Fisher bot statistics
     * @param _fisher Fisher bot address
     * @return stats Fisher statistics
     */
    function getRewardStats(address _fisher) external view returns (FisherStats memory stats) {
        return fisherStats[_fisher];
    }

    /**
     * @notice Check which Fisher relayed a specific transaction
     * @param _txHash Transaction hash
     * @return fisher Fisher bot address
     */
    function getTxFisher(bytes32 _txHash) external view returns (address fisher) {
        return txHashToFisher[_txHash];
    }

    /**
     * @notice Fund the reward pool
     * @dev Owner or anyone can fund the pool
     */
    function fundRewardPool() external payable {
        require(msg.value > 0, "Must send funds");
        totalRewardPool.increment(msg.value);
        emit RewardPoolFunded(msg.value, block.timestamp);
    }

    /**
     * @notice Update reward parameters
     * @param _baseRate Base reward per transaction
     * @param _gasMultiplier Gas cost multiplier
     * @param _complexityBonus Bonus for complex transactions
     */
    function updateRewardParameters(
        uint256 _baseRate,
        uint256 _gasMultiplier,
        uint256 _complexityBonus
    ) external onlyOwner {
        if (_baseRate == 0 || _gasMultiplier == 0) {
            revert InvalidParameters();
        }
        
        baseRewardRate = _baseRate;
        gasMultiplier = _gasMultiplier;
        complexityBonus = _complexityBonus;
        
        emit RewardParametersUpdated(_baseRate, _gasMultiplier, _complexityBonus);
    }

    /**
     * @notice Update claim parameters
     * @param _minClaimAmount Minimum amount to claim
     * @param _claimCooldown Cooldown between claims
     */
    function updateClaimParameters(
        uint256 _minClaimAmount,
        uint256 _claimCooldown
    ) external onlyOwner {
        minClaimAmount = _minClaimAmount;
        claimCooldown = _claimCooldown;
    }

    /**
     * @notice Get global reward pool statistics
     * @return poolBalance Current reward pool balance
     * @return totalPaid Total rewards paid to Fishers
     */
    function getPoolStats() external view returns (uint256 poolBalance, uint256 totalPaid) {
        return (totalRewardPool.current(), totalRewardsPaid.current());
    }

    /**
     * @notice Emergency withdraw (owner only)
     * @dev Only for emergency situations
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdraw failed");
    }

    // Allow contract to receive ETH
    receive() external payable {
        totalRewardPool.increment(msg.value);
        emit RewardPoolFunded(msg.value, block.timestamp);
    }
}


