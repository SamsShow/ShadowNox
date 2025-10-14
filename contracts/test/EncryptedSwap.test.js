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
});