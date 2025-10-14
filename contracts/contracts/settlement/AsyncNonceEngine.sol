// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AsyncNonceEngine
 * @notice Quantum-like nonce management for parallel transaction execution
 * @dev Enables multiple concurrent transactions from the same address
 * Implements "quantum superposition" for transaction states
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
}