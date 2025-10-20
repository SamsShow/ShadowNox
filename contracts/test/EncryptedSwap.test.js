const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EncryptedSwap", function () {
  let asyncNonceEngine, encryptedSwap;
  let owner, relayer, user1;

  beforeEach(async function () {
    [owner, relayer, user1] = await ethers.getSigners();

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

  describe("Swap Intent Submission", function () {
    it("Should submit a swap intent and register it with the AsyncNonceEngine", async function () {
      const encryptedIntent = ethers.toUtf8Bytes("encrypted_swap_data");
      const asyncNonce = 1;

      // FIX: Use solidityPackedKeccak256 to match abi.encodePacked in the contract
      const intentId = ethers.solidityPackedKeccak256(
          ["address", "uint256", "bytes"],
          [owner.address, asyncNonce, encryptedIntent]
      );

      const tx = await encryptedSwap.connect(owner).submitSwapIntent(encryptedIntent, asyncNonce);
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
    let intentId;
    const encryptedIntent = ethers.toUtf8Bytes("encrypted_swap_data_user1");
    const asyncNonce = 1;

    beforeEach(async function () {
      // User1 submits an intent
      await encryptedSwap.connect(user1).submitSwapIntent(encryptedIntent, asyncNonce);
      
      // FIX: Use solidityPackedKeccak256 for correct ID calculation
      intentId = ethers.solidityPackedKeccak256(
          ["address", "uint256", "bytes"],
          [user1.address, asyncNonce, encryptedIntent]
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
    it("Should execute multiple swaps in batch", async function () {
      const intentIds = [];
      const volumes = [];
      
      // Submit 3 swap intents
      for (let i = 1; i <= 3; i++) {
        const encryptedIntent = ethers.toUtf8Bytes(`batch_swap_${i}`);
        await encryptedSwap.connect(user1).submitSwapIntent(encryptedIntent, i);
        
        const intentId = ethers.solidityPackedKeccak256(
          ["address", "uint256", "bytes"],
          [user1.address, i, encryptedIntent]
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

    it("Should handle large batch execution efficiently", async function () {
      const batchSize = 10;
      const intentIds = [];
      const volumes = [];
      
      // Submit multiple intents
      for (let i = 1; i <= batchSize; i++) {
        const encryptedIntent = ethers.toUtf8Bytes(`large_batch_${i}`);
        await encryptedSwap.connect(user1).submitSwapIntent(encryptedIntent, i);
        
        intentIds.push(
          ethers.solidityPackedKeccak256(
            ["address", "uint256", "bytes"],
            [user1.address, i, encryptedIntent]
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
    it("Should use AtomicCounter for aggregate metrics", async function () {
      // Get the AtomicCounter contracts
      const volumeCounter = await encryptedSwap.totalSwapVolume();
      const countCounter = await encryptedSwap.totalSwapCount();
      
      // Verify they are valid addresses
      expect(volumeCounter).to.not.equal(ethers.ZeroAddress);
      expect(countCounter).to.not.equal(ethers.ZeroAddress);
      
      // Execute a swap
      const encryptedIntent = ethers.toUtf8Bytes("atomic_test");
      await encryptedSwap.connect(user1).submitSwapIntent(encryptedIntent, 1);
      
      const intentId = ethers.solidityPackedKeccak256(
        ["address", "uint256", "bytes"],
        [user1.address, 1, encryptedIntent]
      );
      
      await encryptedSwap.connect(relayer).executeSwap(intentId, ethers.parseEther("10"));
      
      // Query AtomicCounter directly
      const volumeCounterContract = await ethers.getContractAt("AtomicCounter", volumeCounter);
      const currentVolume = await volumeCounterContract.current();
      
      expect(currentVolume).to.equal(ethers.parseEther("10"));
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle empty encrypted intent", async function () {
      const emptyIntent = "0x";
      await expect(encryptedSwap.connect(user1).submitSwapIntent(emptyIntent, 1))
        .to.not.be.reverted;
    });

    it("Should handle zero volume execution", async function () {
      const encryptedIntent = ethers.toUtf8Bytes("zero_volume_test");
      await encryptedSwap.connect(user1).submitSwapIntent(encryptedIntent, 1);
      
      const intentId = ethers.solidityPackedKeccak256(
        ["address", "uint256", "bytes"],
        [user1.address, 1, encryptedIntent]
      );
      
      await expect(encryptedSwap.connect(relayer).executeSwap(intentId, 0))
        .to.not.be.reverted;
      
      const metrics = await encryptedSwap.getAggregateMetrics();
      expect(metrics.volume).to.equal(0);
    });

    it("Should handle very large volume values", async function () {
      const encryptedIntent = ethers.toUtf8Bytes("large_volume_test");
      await encryptedSwap.connect(user1).submitSwapIntent(encryptedIntent, 1);
      
      const intentId = ethers.solidityPackedKeccak256(
        ["address", "uint256", "bytes"],
        [user1.address, 1, encryptedIntent]
      );
      
      const largeVolume = ethers.parseEther("1000000");
      await expect(encryptedSwap.connect(relayer).executeSwap(intentId, largeVolume))
        .to.not.be.reverted;
    });
  });
});