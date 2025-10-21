const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * EncryptedSwap Tests
 * 
 * Intent Data Format (ABI-encoded):
 * - tokenIn (address): Input token address
 * - tokenOut (address): Output token address
 * - amountIn (uint256): Input amount
 * - minAmountOut (uint256): Minimum output amount (slippage protection)
 * - deadline (uint256): Transaction deadline timestamp
 * 
 * Example:
 * const intentData = ethers.AbiCoder.defaultAbiCoder().encode(
 *   ["address", "address", "uint256", "uint256", "uint256"],
 *   [tokenIn, tokenOut, amountIn, minAmountOut, deadline]
 * );
 */

describe("EncryptedSwap", function () {
  let asyncNonceEngine, encryptedSwap;
  let owner, relayer, user1;
  let TOKEN_IN, TOKEN_OUT; // Mock token addresses for testing

  beforeEach(async function () {
    [owner, relayer, user1] = await ethers.getSigners();

    // Use addresses as mock token addresses
    TOKEN_IN = "0x1111111111111111111111111111111111111111";
    TOKEN_OUT = "0x2222222222222222222222222222222222222222";

    const AsyncNonceEngineFactory = await ethers.getContractFactory("AsyncNonceEngine");
    asyncNonceEngine = await AsyncNonceEngineFactory.deploy();
    await asyncNonceEngine.waitForDeployment();
    const engineAddress = await asyncNonceEngine.getAddress();

    const EncryptedSwapFactory = await ethers.getContractFactory("EncryptedSwap");
    encryptedSwap = await EncryptedSwapFactory.connect(relayer).deploy(engineAddress);
    await encryptedSwap.waitForDeployment();
    const swapAddress = await encryptedSwap.getAddress();

    // FIX: Authorize the EncryptedSwap contract to call the AsyncNonceEngine
    await asyncNonceEngine.connect(owner).setAuthorizedContract(swapAddress, true);
  });

  // Helper function to create ABI-encoded intent data
  function createIntentData(tokenIn, tokenOut, amountIn, minAmountOut, deadline) {
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256", "uint256", "uint256"],
      [tokenIn, tokenOut, amountIn, minAmountOut, deadline]
    );
  }

  describe("Swap Intent Submission", function () {
    it("Should submit a swap intent with ABI-encoded data and register it with the AsyncNonceEngine", async function () {
      // Create properly encoded intent data
      const intentData = createIntentData(
        TOKEN_IN, 
        TOKEN_OUT, 
        ethers.parseEther("100"), 
        ethers.parseEther("95"), 
        Math.floor(Date.now() / 1000) + 3600
      );
      const asyncNonce = 1;

      // FIX: Use solidityPackedKeccak256 to match abi.encodePacked in the contract
      const intentId = ethers.solidityPackedKeccak256(
          ["address", "uint256", "bytes"],
          [owner.address, asyncNonce, intentData]
      );

      const tx = await encryptedSwap.connect(owner).submitSwapIntent(intentData, asyncNonce);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      // FIX: Assert against the actual block timestamp from the transaction receipt
      await expect(tx)
        .to.emit(encryptedSwap, "SwapIntentSubmitted")
        .withArgs(owner.address, intentId, asyncNonce, block.timestamp);

      const asyncState = await asyncNonceEngine.getAsyncState(owner.address, asyncNonce);
      expect(asyncState.txHash).to.equal(intentId);
      expect(asyncState.state).to.equal(0); // Pending
    });
  });

  describe("Swap Execution and Cancellation", function () {
    let intentId, intentData;
    const asyncNonce = 1;

    beforeEach(async function () {
      // Create ABI-encoded intent data for user1
      intentData = createIntentData(
        TOKEN_IN,
        TOKEN_OUT,
        ethers.parseEther("50"),
        ethers.parseEther("48"),
        Math.floor(Date.now() / 1000) + 3600
      );
      
      // User1 submits an intent
      await encryptedSwap.connect(user1).submitSwapIntent(intentData, asyncNonce);
      
      // FIX: Use solidityPackedKeccak256 for correct ID calculation
      intentId = ethers.solidityPackedKeccak256(
          ["address", "uint256", "bytes"],
          [user1.address, asyncNonce, intentData]
      );
    });

    it("Should allow the relayer (owner) to execute a swap", async function () {
      const swapVolume = ethers.parseEther("10");

      const tx = await encryptedSwap.connect(relayer).executeSwap(intentId, swapVolume);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(encryptedSwap, "SwapExecuted")
        .withArgs(intentId, block.timestamp);

      const intent = await encryptedSwap.getSwapIntent(intentId);
      expect(intent.executed).to.be.true;

      const metrics = await encryptedSwap.getAggregateMetrics();
      expect(metrics.volume).to.equal(swapVolume);
      expect(metrics.count).to.equal(1);
    });

    it("Should not allow a non-owner to execute a swap", async function () {
      const swapVolume = ethers.parseEther("10");
      await expect(encryptedSwap.connect(user1).executeSwap(intentId, swapVolume))
        .to.be.revertedWithCustomError(encryptedSwap, "NotOwner");
    });

    it("Should emit FisherRewardRecorded event when FisherRewards is set", async function () {
      // Deploy and link FisherRewards
      const FisherRewardsFactory = await ethers.getContractFactory("FisherRewards");
      const fisherRewards = await FisherRewardsFactory.deploy();
      await fisherRewards.waitForDeployment();
      await encryptedSwap.connect(relayer).setFisherRewards(await fisherRewards.getAddress());

      const swapVolume = ethers.parseEther("10");
      
      const tx = await encryptedSwap.connect(relayer).executeSwap(intentId, swapVolume);
      const receipt = await tx.wait();

      // Check for FisherRewardRecorded event
      const rewardEvents = receipt.logs.filter(log => {
        try {
          const parsed = encryptedSwap.interface.parseLog(log);
          return parsed.name === "FisherRewardRecorded";
        } catch {
          return false;
        }
      });

      expect(rewardEvents.length).to.be.greaterThan(0);
    });
    
    it("Should allow the relayer (owner) to cancel a swap", async function () {
        const tx = await encryptedSwap.connect(relayer).cancelSwap(intentId);
        const receipt = await tx.wait();
        const block = await ethers.provider.getBlock(receipt.blockNumber);

        await expect(tx)
            .to.emit(encryptedSwap, "SwapCancelled")
            .withArgs(intentId, block.timestamp);

        const intent = await encryptedSwap.getSwapIntent(intentId);
        expect(intent.cancelled).to.be.true;
    });

    it("Should prevent executing an already processed swap", async function () {
        const swapVolume = ethers.parseEther("10");
        await encryptedSwap.connect(relayer).executeSwap(intentId, swapVolume);

        await expect(encryptedSwap.connect(relayer).executeSwap(intentId, swapVolume))
            .to.be.revertedWithCustomError(encryptedSwap, "IntentAlreadyProcessed");
    });
  });

  describe("Batch Execution (Arcology Optimization)", function () {
    it("Should execute multiple swaps in batch with ABI-encoded data", async function () {
      const intentIds = [];
      const volumes = [];
      
      // Submit 3 swap intents with proper ABI encoding
      for (let i = 1; i <= 3; i++) {
        const intentData = createIntentData(
          TOKEN_IN,
          TOKEN_OUT,
          ethers.parseEther(`${i * 10}`),
          ethers.parseEther(`${i * 9.5}`),
          Math.floor(Date.now() / 1000) + 3600
        );
        
        await encryptedSwap.connect(user1).submitSwapIntent(intentData, i);
        
        const intentId = ethers.solidityPackedKeccak256(
          ["address", "uint256", "bytes"],
          [user1.address, i, intentData]
        );
        
        intentIds.push(intentId);
        volumes.push(ethers.parseEther(`${i * 5}`));
      }
      
      // Execute in batch
      await expect(encryptedSwap.connect(relayer).batchExecuteSwaps(intentIds, volumes))
        .to.emit(encryptedSwap, "BatchSwapsExecuted");
      
      // Verify all executed
      for (const intentId of intentIds) {
        const intent = await encryptedSwap.getSwapIntent(intentId);
        expect(intent.executed).to.be.true;
      }
      
      // Verify aggregate metrics
      const metrics = await encryptedSwap.getAggregateMetrics();
      const expectedVolume = volumes.reduce((sum, v) => sum + v, 0n);
      expect(metrics.volume).to.equal(expectedVolume);
      expect(metrics.count).to.equal(3);
    });

    it("Should revert batch execution with mismatched array lengths", async function () {
      const intentIds = [ethers.keccak256(ethers.toUtf8Bytes("test"))];
      const volumes = [ethers.parseEther("10"), ethers.parseEther("20")];
      
      await expect(encryptedSwap.connect(relayer).batchExecuteSwaps(intentIds, volumes))
        .to.be.revertedWithCustomError(encryptedSwap, "InvalidBatchSize");
    });

    it("Should revert batch execution with empty arrays", async function () {
      await expect(encryptedSwap.connect(relayer).batchExecuteSwaps([], []))
        .to.be.revertedWithCustomError(encryptedSwap, "InvalidBatchSize");
    });

    it("Should handle large batch execution efficiently with ABI-encoded data", async function () {
      const batchSize = 10;
      const intentIds = [];
      const volumes = [];
      
      // Submit multiple intents with proper ABI encoding
      for (let i = 1; i <= batchSize; i++) {
        const intentData = createIntentData(
          TOKEN_IN,
          TOKEN_OUT,
          ethers.parseEther("1"),
          ethers.parseEther("0.95"),
          Math.floor(Date.now() / 1000) + 3600
        );
        
        await encryptedSwap.connect(user1).submitSwapIntent(intentData, i);
        
        intentIds.push(
          ethers.solidityPackedKeccak256(
            ["address", "uint256", "bytes"],
            [user1.address, i, intentData]
          )
        );
        volumes.push(ethers.parseEther("1"));
      }
      
      // Execute batch
      const tx = await encryptedSwap.connect(relayer).batchExecuteSwaps(intentIds, volumes);
      const receipt = await tx.wait();
      
      // Record gas usage for analysis
      console.log(`      Batch execution gas (${batchSize} swaps): ${receipt.gasUsed.toString()}`);
      
      const metrics = await encryptedSwap.getAggregateMetrics();
      expect(metrics.count).to.equal(batchSize);
    });
  });

  describe("AtomicCounter Integration", function () {
    it("Should use AtomicCounter for aggregate metrics with ABI-encoded data", async function () {
      // Get the AtomicCounter contracts
      const volumeCounter = await encryptedSwap.totalSwapVolume();
      const countCounter = await encryptedSwap.totalSwapCount();
      
      // Verify they are valid addresses
      expect(volumeCounter).to.not.equal(ethers.ZeroAddress);
      expect(countCounter).to.not.equal(ethers.ZeroAddress);
      
      // Create and submit intent with ABI-encoded data
      const intentData = createIntentData(
        TOKEN_IN,
        TOKEN_OUT,
        ethers.parseEther("10"),
        ethers.parseEther("9.5"),
        Math.floor(Date.now() / 1000) + 3600
      );
      
      await encryptedSwap.connect(user1).submitSwapIntent(intentData, 1);
      
      const intentId = ethers.solidityPackedKeccak256(
        ["address", "uint256", "bytes"],
        [user1.address, 1, intentData]
      );
      
      await encryptedSwap.connect(relayer).executeSwap(intentId, ethers.parseEther("10"));
      
      // Query AtomicCounter directly
      const volumeCounterContract = await ethers.getContractAt("AtomicCounter", volumeCounter);
      const currentVolume = await volumeCounterContract.current();
      
      expect(currentVolume).to.equal(ethers.parseEther("10"));
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle empty intent data", async function () {
      const emptyIntent = "0x";
      await expect(encryptedSwap.connect(user1).submitSwapIntent(emptyIntent, 1))
        .to.not.be.reverted;
    });

    it("Should handle zero volume execution with ABI-encoded data", async function () {
      const intentData = createIntentData(
        TOKEN_IN,
        TOKEN_OUT,
        ethers.parseEther("10"),
        ethers.parseEther("0"),
        Math.floor(Date.now() / 1000) + 3600
      );
      
      await encryptedSwap.connect(user1).submitSwapIntent(intentData, 1);
      
      const intentId = ethers.solidityPackedKeccak256(
        ["address", "uint256", "bytes"],
        [user1.address, 1, intentData]
      );
      
      await expect(encryptedSwap.connect(relayer).executeSwap(intentId, 0))
        .to.not.be.reverted;
      
      const metrics = await encryptedSwap.getAggregateMetrics();
      expect(metrics.volume).to.equal(0);
    });

    it("Should handle very large volume values with ABI-encoded data", async function () {
      const intentData = createIntentData(
        TOKEN_IN,
        TOKEN_OUT,
        ethers.parseEther("1000000"),
        ethers.parseEther("950000"),
        Math.floor(Date.now() / 1000) + 3600
      );
      
      await encryptedSwap.connect(user1).submitSwapIntent(intentData, 1);
      
      const intentId = ethers.solidityPackedKeccak256(
        ["address", "uint256", "bytes"],
        [user1.address, 1, intentData]
      );
      
      const largeVolume = ethers.parseEther("1000000");
      await expect(encryptedSwap.connect(relayer).executeSwap(intentId, largeVolume))
        .to.not.be.reverted;
    });
  });
});