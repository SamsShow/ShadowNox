const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * AsyncNonceEngine Tests
 * 
 * Tests async nonce management for Arcology parallel execution
 * - Quantum-like transaction states
 * - Parallel transaction execution
 * - Optimistic concurrency compatibility
 */
describe("AsyncNonceEngine", function () {
  let engine;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const AsyncNonceEngineFactory = await ethers.getContractFactory("AsyncNonceEngine");
    engine = await AsyncNonceEngineFactory.deploy();
    await engine.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the last settled nonce to 0 initially", async function () {
      expect(await engine.getLastSettledNonce(owner.address)).to.equal(0);
    });

    it("Should show no pending async transactions initially", async function () {
      expect(await engine.hasPendingAsync(owner.address)).to.be.false;
    });
  });

  describe("createAsyncBranch", function () {
    it("Should allow creating multiple pending async transactions", async function () {
      const txHash1 = ethers.keccak256(ethers.toUtf8Bytes("tx1"));
      const txHash2 = ethers.keccak256(ethers.toUtf8Bytes("tx2"));

      await expect(engine.createAsyncBranch(owner.address, 1, txHash1))
        .to.emit(engine, "AsyncTxCreated")
        .withArgs(owner.address, 1, txHash1);

      await expect(engine.createAsyncBranch(owner.address, 2, txHash2))
        .to.emit(engine, "AsyncTxCreated")
        .withArgs(owner.address, 2, txHash2);

      const tx1 = await engine.getAsyncState(owner.address, 1);
      const tx2 = await engine.getAsyncState(owner.address, 2);

      expect(tx1.state).to.equal(0); 
      expect(tx2.state).to.equal(0); 
      expect(await engine.hasPendingAsync(owner.address)).to.be.true;
    });

    it("Should revert if creating a branch with a nonce less than or equal to the last settled nonce", async function () {
      const txHash1 = ethers.keccak256(ethers.toUtf8Bytes("tx1"));
      await engine.createAsyncBranch(owner.address, 1, txHash1);
      await engine.settleAsync(1);

      const txHash2 = ethers.keccak256(ethers.toUtf8Bytes("tx2"));
      await expect(engine.createAsyncBranch(owner.address, 1, txHash2)).to.be.revertedWithCustomError(
        engine,
        "InvalidNonce"
      );
    });

    it("Should revert if called by a non-authorized address", async function() {
        const txHash1 = ethers.keccak256(ethers.toUtf8Bytes("tx1"));
        await expect(engine.connect(addr1).createAsyncBranch(addr1.address, 1, txHash1))
            .to.be.revertedWithCustomError(engine, "NotAuthorized");
    });
  });

  describe("settleAsync (Quantum Collapse)", function () {
    beforeEach(async function () {
      await engine.createAsyncBranch(owner.address, 1, ethers.keccak256(ethers.toUtf8Bytes("tx1")));
      await engine.createAsyncBranch(owner.address, 2, ethers.keccak256(ethers.toUtf8Bytes("tx2")));
      await engine.createAsyncBranch(owner.address, 3, ethers.keccak256(ethers.toUtf8Bytes("tx3")));
    });

    it("Should settle the chosen nonce and discard conflicting (lower) nonces", async function () {
      await expect(engine.settleAsync(2))
        .to.emit(engine, "QuantumCollapse")
        .withArgs(owner.address, 2, [1]);

      const state1 = (await engine.getAsyncState(owner.address, 1)).state;
      const state2 = (await engine.getAsyncState(owner.address, 2)).state;
      const state3 = (await engine.getAsyncState(owner.address, 3)).state;

      expect(state1).to.equal(2); 
      expect(state2).to.equal(1);
      expect(state3).to.equal(0); 
    });

    it("Should update the lastSettledNonce correctly", async function () {
      await engine.settleAsync(2);
      expect(await engine.getLastSettledNonce(owner.address)).to.equal(2);
    });
    
    it("Should correctly manage the activeNonces array after settlement", async function() {
        await engine.settleAsync(2);
        
        const hasPending = await engine.hasPendingAsync(owner.address);
        expect(hasPending).to.be.true;

        await engine.settleAsync(3);
        const hasPendingAfter = await engine.hasPendingAsync(owner.address);
        expect(hasPendingAfter).to.be.false;
    });

    it("Should revert if trying to settle a nonce that has not been created", async function () {
      await expect(engine.settleAsync(4)).to.be.revertedWithCustomError(
        engine,
        "InvalidNonce"
      );
    });

    it("Should revert if trying to settle a nonce that is less than or equal to the last settled nonce", async function () {
      await engine.settleAsync(2);
      await expect(engine.settleAsync(1)).to.be.revertedWithCustomError(
        engine,
        "AlreadySettled"
      );
      await expect(engine.settleAsync(2)).to.be.revertedWithCustomError(
        engine,
        "AlreadySettled"
      );
    });
  });
});