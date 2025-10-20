// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AsyncNonceEngine
 * @notice Quantum-like nonce management for parallel transaction execution on Arcology
 * @dev Enables multiple concurrent transactions from the same address
 * Implements "quantum superposition" for transaction states
 * 
 * Deployed on Arcology Parallel Blockchain:
 * - Compatible with Arcology's optimistic concurrency control
 * - Leverages storage-slot level conflict resolution
 * - Supports 10k-15k TPS parallel execution
 * - Designed for Arcology's Concurrent Library integration
 * 
 * BOT INTEGRATION: Fisher bots use this for parallel transaction relay
 * - CreateAsyncBranch: Register parallel user transactions
 * - SettleAsync: Finalize transaction after execution
 * - Batch operations: Optimize for high-throughput scenarios
 */
contract AsyncNonceEngine {
    // Transaction state enum
    enum TxState {
        Pending,    // In quantum superposition
        Settled,    // Collapsed to valid state
        Discarded   // Collapsed to invalid state
    }

    // Async transaction structure
    struct AsyncTransaction {
        address sender;
        uint256 asyncNonce;
        bytes32 txHash;
        TxState state;
        uint256 timestamp;
        uint256 settlementBlock;
    }

    // Address => Async Nonce => Transaction
    mapping(address => mapping(uint256 => AsyncTransaction)) private asyncTransactions;

    // Address => Active async nonces
    mapping(address => uint256[]) private activeNonces;

    // Address => Last settled nonce
    mapping(address => uint256) private lastSettledNonce;

    address public owner;
    mapping(address => bool) public authorizedContracts;

    // Events
    event AsyncTxCreated(address indexed sender, uint256 asyncNonce, bytes32 txHash);
    event AsyncTxSettled(address indexed sender, uint256 asyncNonce, bytes32 txHash);
    event AsyncTxDiscarded(address indexed sender, uint256 asyncNonce, bytes32 txHash);
    event QuantumCollapse(address indexed sender, uint256 settledNonce, uint256[] discardedNonces);
    
    // BOT MONITORING: Events for Fisher bot performance tracking
    event BatchSettlementCompleted(address indexed sender, uint256 count, uint256 timestamp);

    error InvalidNonce();
    error AlreadySettled();
    error NotOwner();

    error NotAuthorized();

    constructor() {
        owner = msg.sender;
        authorizedContracts[msg.sender] = true; // The deployer is always authorized
    }

    modifier onlyAuthorized() {
        if (!authorizedContracts[msg.sender]) {
            revert NotAuthorized();
        }
        _;
    }

    function setAuthorizedContract(address _contract, bool _isAuthorized) external {
        if (msg.sender != owner) revert(); // Simple owner check
        authorizedContracts[_contract] = _isAuthorized;
    }

    /**
     * @notice Create a new async transaction branch
     * @param _asyncNonce Async nonce for this transaction
     * @param _txHash Transaction hash
     */
     function createAsyncBranch(address _sender, uint256 _asyncNonce, bytes32 _txHash) external onlyAuthorized returns (bool) {
        if (_asyncNonce <= lastSettledNonce[_sender]) {
            revert InvalidNonce();
        }

        for (uint i = 0; i < activeNonces[_sender].length; i++) {
            if (activeNonces[_sender][i] == _asyncNonce) {
                return true;
            }
        }

        asyncTransactions[_sender][_asyncNonce] = AsyncTransaction({
            sender: _sender,
            asyncNonce: _asyncNonce,
            txHash: _txHash,
            state: TxState.Pending,
            timestamp: block.timestamp,
            settlementBlock: 0
        });

        activeNonces[_sender].push(_asyncNonce);
        emit AsyncTxCreated(_sender, _asyncNonce, _txHash);
        return true;
    }

    /**
     * @notice Settle async transactions (collapse quantum state)
     * @param _settlementNonce Nonce to settle
     */
    function settleAsync(uint256 _settlementNonce) external {
        if (_settlementNonce <= lastSettledNonce[msg.sender]) {
            revert AlreadySettled();
        }

        uint256[] memory noncesToDiscard = new uint256[](activeNonces[msg.sender].length);
        uint discardCount = 0;
        bool settlementNonceFound = false;

        for (uint i = 0; i < activeNonces[msg.sender].length; i++) {
            uint256 currentNonce = activeNonces[msg.sender][i];
            
            if (currentNonce == _settlementNonce) {
                AsyncTransaction storage txn = asyncTransactions[msg.sender][currentNonce];
                txn.state = TxState.Settled;
                txn.settlementBlock = block.number;
                settlementNonceFound = true;
                emit AsyncTxSettled(msg.sender, currentNonce, txn.txHash);
            } else if (currentNonce < _settlementNonce) {
                // Discard conflicting (lower nonce) transactions
                AsyncTransaction storage txn = asyncTransactions[msg.sender][currentNonce];
                txn.state = TxState.Discarded;
                txn.settlementBlock = block.number;
                noncesToDiscard[discardCount] = currentNonce;
                discardCount++;
                emit AsyncTxDiscarded(msg.sender, currentNonce, txn.txHash);
            }
        }
        
        if (!settlementNonceFound) {
            revert InvalidNonce();
        }

        // Clean up activeNonces array
        uint256[] memory newActiveNonces = new uint256[](activeNonces[msg.sender].length - discardCount - 1);
        uint newIndex = 0;
        for (uint i = 0; i < activeNonces[msg.sender].length; i++) {
             uint256 nonce = activeNonces[msg.sender][i];
             if(nonce > _settlementNonce) {
                 newActiveNonces[newIndex] = nonce;
                 newIndex++;
             }
        }
        activeNonces[msg.sender] = newActiveNonces;

        lastSettledNonce[msg.sender] = _settlementNonce;

        // Resize discard array for the event
        uint256[] memory finalDiscarded = new uint256[](discardCount);
        for(uint i=0; i < discardCount; i++) {
            finalDiscarded[i] = noncesToDiscard[i];
        }

        emit QuantumCollapse(msg.sender, _settlementNonce, finalDiscarded);
    }

    /**
     * @notice Get async transaction state
     * @param _sender Transaction sender
     * @param _asyncNonce Async nonce to query
     */
    function getAsyncState(address _sender, uint256 _asyncNonce)
        external
        view
        returns (AsyncTransaction memory)
    {
        return asyncTransactions[_sender][_asyncNonce];
    }

    /**
     * @notice Check if address has pending async transactions
     * @param _sender Address to check
     */
    function hasPendingAsync(address _sender) external view returns (bool) {
        return activeNonces[_sender].length > 0;
    }

    function getLastSettledNonce(address _sender) external view returns (uint256) {
        return lastSettledNonce[_sender];
    }
    
    /**
     * @notice Batch settlement for multiple users (Arcology parallel optimization)
     * @dev Optimized for Fisher bots settling multiple transactions efficiently
     * @param _senders Array of sender addresses
     * @param _settlementNonces Array of nonces to settle for each sender
     */
    function batchSettleAsync(
        address[] calldata _senders,
        uint256[] calldata _settlementNonces
    ) external {
        require(_senders.length == _settlementNonces.length, "Array length mismatch");
        require(_senders.length > 0, "Empty batch");
        
        for (uint256 i = 0; i < _senders.length; i++) {
            address sender = _senders[i];
            uint256 nonce = _settlementNonces[i];
            
            // Verify caller is authorized to settle for this user
            // In production, add proper authorization checks
            require(sender == msg.sender || authorizedContracts[msg.sender], "Not authorized");
            
            if (nonce <= lastSettledNonce[sender]) {
                continue; // Skip already settled nonces
            }
            
            // Simplified settlement logic for batch operations
            bool settlementNonceFound = false;
            
            for (uint j = 0; j < activeNonces[sender].length; j++) {
                uint256 currentNonce = activeNonces[sender][j];
                
                if (currentNonce == nonce) {
                    AsyncTransaction storage txn = asyncTransactions[sender][currentNonce];
                    txn.state = TxState.Settled;
                    txn.settlementBlock = block.number;
                    settlementNonceFound = true;
                    emit AsyncTxSettled(sender, currentNonce, txn.txHash);
                } else if (currentNonce < nonce) {
                    AsyncTransaction storage txn = asyncTransactions[sender][currentNonce];
                    txn.state = TxState.Discarded;
                    txn.settlementBlock = block.number;
                    emit AsyncTxDiscarded(sender, currentNonce, txn.txHash);
                }
            }
            
            if (settlementNonceFound) {
                // Clean up activeNonces array
                uint256[] memory newActiveNonces = new uint256[](activeNonces[sender].length);
                uint newIndex = 0;
                for (uint j = 0; j < activeNonces[sender].length; j++) {
                    uint256 activeNonce = activeNonces[sender][j];
                    if(activeNonce > nonce) {
                        newActiveNonces[newIndex] = activeNonce;
                        newIndex++;
                    }
                }
                
                // Resize array
                uint256[] memory finalActiveNonces = new uint256[](newIndex);
                for (uint j = 0; j < newIndex; j++) {
                    finalActiveNonces[j] = newActiveNonces[j];
                }
                activeNonces[sender] = finalActiveNonces;
                
                lastSettledNonce[sender] = nonce;
            }
        }
        
        // BOT MONITORING: Track batch settlement performance
        emit BatchSettlementCompleted(msg.sender, _senders.length, block.timestamp);
    }
    
    /**
     * @notice Get all pending async nonces for an address
     * @dev Useful for Fisher bots to track pending transactions
     * @param _sender Address to query
     * @return nonces Array of pending async nonces
     */
    function getPendingNonces(address _sender) external view returns (uint256[] memory nonces) {
        return activeNonces[_sender];
    }
}