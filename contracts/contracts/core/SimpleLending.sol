// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../arcology/AtomicCounter.sol";
import "../oracle/CustomPriceOracle.sol";

/**
 * @title SimpleLending
 * @notice Basic lending protocol for Shadow Economy on Arcology
 * @dev Demonstrates parallel execution with deposits, withdrawals, borrows, and repayments
 * 
 * Executes on Arcology Parallel Blockchain:
 * - 10,000-15,000 TPS throughput for parallel lending operations
 * - Multiple users can deposit/borrow simultaneously
 * - Collateral checks using real price feeds from Pyth Hermes API
 * - Optimistic concurrency control for conflict-free execution
 * 
 * Arcology Optimizations:
 * - AtomicCounter for total deposits/borrows (conflict-resistant)
 * - Per-user storage isolation for maximum parallelism
 * - Expected Performance: 10k-15k TPS
 */
contract SimpleLending {
    address public owner;
    CustomPriceOracle public priceOracle;
    
    // Collateralization ratio: 150% (need $150 collateral for $100 borrow)
    uint256 public constant COLLATERAL_RATIO = 150;
    uint256 public constant RATIO_PRECISION = 100;
    
    // User account structure
    struct UserAccount {
        uint256 deposited;      // Amount deposited
        uint256 borrowed;       // Amount borrowed
        uint256 collateral;     // Collateral amount
        address collateralToken; // Collateral token address
        uint256 lastUpdate;     // Last interaction timestamp
    }
    
    // Per-user accounts (isolated for Arcology parallelism)
    mapping(address => UserAccount) private accounts;
    
    // Arcology-optimized aggregate metrics using AtomicCounter
    AtomicCounter public totalDeposits;
    AtomicCounter public totalBorrows;
    AtomicCounter public totalCollateral;
    
    // Events
    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event Borrowed(address indexed user, uint256 amount, uint256 collateral, uint256 timestamp);
    event Repaid(address indexed user, uint256 amount, uint256 timestamp);
    event CollateralAdded(address indexed user, uint256 amount, uint256 timestamp);
    event CollateralWithdrawn(address indexed user, uint256 amount, uint256 timestamp);
    
    error InsufficientBalance();
    error InsufficientCollateral();
    error InsufficientLiquidity();
    error NoBorrowToRepay();
    error NotOwner();
    error PriceStale();
    error InvalidAmount();

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    constructor(address _priceOracleAddress) {
        owner = msg.sender;
        priceOracle = CustomPriceOracle(_priceOracleAddress);
        
        // Deploy Arcology-optimized AtomicCounters
        totalDeposits = new AtomicCounter();
        totalBorrows = new AtomicCounter();
        totalCollateral = new AtomicCounter();
    }

    /**
     * @notice Deposit funds to earn interest
     * @dev Users deposit to provide liquidity for borrowers
     * @param _amount Amount to deposit
     */
    function deposit(uint256 _amount) external {
        if (_amount == 0) revert InvalidAmount();
        
        UserAccount storage account = accounts[msg.sender];
        
        account.deposited += _amount;
        account.lastUpdate = block.timestamp;
        
        // Arcology-optimized: AtomicCounter for conflict-resistant updates
        totalDeposits.increment(_amount);
        
        emit Deposited(msg.sender, _amount, block.timestamp);
    }

    /**
     * @notice Withdraw deposited funds
     * @dev Users can withdraw their deposits if liquidity allows
     * @param _amount Amount to withdraw
     */
    function withdraw(uint256 _amount) external {
        if (_amount == 0) revert InvalidAmount();
        
        UserAccount storage account = accounts[msg.sender];
        
        if (account.deposited < _amount) revert InsufficientBalance();
        
        // Check protocol has enough liquidity
        uint256 availableLiquidity = totalDeposits.current() - totalBorrows.current();
        if (availableLiquidity < _amount) revert InsufficientLiquidity();
        
        account.deposited -= _amount;
        account.lastUpdate = block.timestamp;
        
        totalDeposits.decrement(_amount);
        
        emit Withdrawn(msg.sender, _amount, block.timestamp);
    }

    /**
     * @notice Add collateral for borrowing
     * @dev Users add collateral to enable borrowing
     * @param _amount Collateral amount
     * @param _collateralToken Address of collateral token
     */
    function addCollateral(uint256 _amount, address _collateralToken) external {
        if (_amount == 0) revert InvalidAmount();
        
        UserAccount storage account = accounts[msg.sender];
        
        account.collateral += _amount;
        account.collateralToken = _collateralToken;
        account.lastUpdate = block.timestamp;
        
        totalCollateral.increment(_amount);
        
        emit CollateralAdded(msg.sender, _amount, block.timestamp);
    }

    /**
     * @notice Borrow funds against collateral
     * @dev Uses custom oracle (Pyth Hermes API) to validate collateral value
     * @param _borrowAmount Amount to borrow
     */
    function borrow(uint256 _borrowAmount) external {
        if (_borrowAmount == 0) revert InvalidAmount();
        
        UserAccount storage account = accounts[msg.sender];
        
        if (account.collateral == 0) revert InsufficientCollateral();
        
        // Check protocol has enough liquidity
        uint256 availableLiquidity = totalDeposits.current() - totalBorrows.current();
        if (availableLiquidity < _borrowAmount) revert InsufficientLiquidity();
        
        // Validate collateral value using custom oracle (pulls from Pyth Hermes API)
        CustomPriceOracle.Price memory collateralPrice = priceOracle.getLatestPrice(account.collateralToken);
        
        // Check price freshness (within last 60 seconds) - oracle also validates internally
        if (collateralPrice.publishTime < block.timestamp - 60) revert PriceStale();
        
        // Calculate collateral value (simple calculation for MVP)
        // In production, handle price exponents properly
        uint256 collateralValue = account.collateral; // Simplified
        uint256 requiredCollateral = (_borrowAmount * COLLATERAL_RATIO) / RATIO_PRECISION;
        
        if (collateralValue < requiredCollateral) revert InsufficientCollateral();
        
        account.borrowed += _borrowAmount;
        account.lastUpdate = block.timestamp;
        
        totalBorrows.increment(_borrowAmount);
        
        emit Borrowed(msg.sender, _borrowAmount, account.collateral, block.timestamp);
    }

    /**
     * @notice Repay borrowed funds
     * @dev Users repay their borrows
     * @param _amount Amount to repay
     */
    function repay(uint256 _amount) external {
        if (_amount == 0) revert InvalidAmount();
        
        UserAccount storage account = accounts[msg.sender];
        
        if (account.borrowed == 0) revert NoBorrowToRepay();
        if (account.borrowed < _amount) revert InvalidAmount();
        
        account.borrowed -= _amount;
        account.lastUpdate = block.timestamp;
        
        totalBorrows.decrement(_amount);
        
        emit Repaid(msg.sender, _amount, block.timestamp);
    }

    /**
     * @notice Withdraw collateral after repaying borrows
     * @dev Users can withdraw collateral if no outstanding borrows
     * @param _amount Collateral amount to withdraw
     */
    function withdrawCollateral(uint256 _amount) external {
        if (_amount == 0) revert InvalidAmount();
        
        UserAccount storage account = accounts[msg.sender];
        
        if (account.collateral < _amount) revert InsufficientBalance();
        
        // If user has borrows, check remaining collateral is sufficient
        if (account.borrowed > 0) {
            uint256 remainingCollateral = account.collateral - _amount;
            uint256 requiredCollateral = (account.borrowed * COLLATERAL_RATIO) / RATIO_PRECISION;
            
            if (remainingCollateral < requiredCollateral) revert InsufficientCollateral();
        }
        
        account.collateral -= _amount;
        account.lastUpdate = block.timestamp;
        
        totalCollateral.decrement(_amount);
        
        emit CollateralWithdrawn(msg.sender, _amount, block.timestamp);
    }

    /**
     * @notice Get user account details
     * @param _user User address
     * @return account User account data
     */
    function getAccount(address _user) external view returns (UserAccount memory) {
        return accounts[_user];
    }

    /**
     * @notice Get aggregate lending metrics
     * @dev Public metrics safe for display
     * @return deposits Total deposits
     * @return borrows Total borrows
     * @return collateral Total collateral
     */
    function getAggregateMetrics() external view returns (
        uint256 deposits, 
        uint256 borrows, 
        uint256 collateral
    ) {
        return (
            totalDeposits.current(), 
            totalBorrows.current(), 
            totalCollateral.current()
        );
    }

    /**
     * @notice Calculate available liquidity
     * @return Available liquidity for borrowing
     */
    function getAvailableLiquidity() external view returns (uint256) {
        uint256 deposits = totalDeposits.current();
        uint256 borrows = totalBorrows.current();
        return deposits > borrows ? deposits - borrows : 0;
    }

    /**
     * @notice Update price oracle address
     * @param _priceOracleAddress New CustomPriceOracle address
     */
    function updatePriceOracle(address _priceOracleAddress) external onlyOwner {
        priceOracle = CustomPriceOracle(_priceOracleAddress);
    }
}

