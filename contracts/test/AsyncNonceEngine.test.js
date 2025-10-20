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

  describe("Batch Settlement (Arcology Optimization)", function () {
    beforeEach(async function () {
      // Create async branches for both owner and addr1
      await engine.createAsyncBranch(owner.address, 1, ethers.keccak256(ethers.toUtf8Bytes("owner-tx1")));
      await engine.createAsyncBranch(owner.address, 2, ethers.keccak256(ethers.toUtf8Bytes("owner-tx2")));
      
      await engine.setAuthorizedContract(addr1.address, true);
      await engine.connect(addr1).createAsyncBranch(addr1.address, 1, ethers.keccak256(ethers.toUtf8Bytes("addr1-tx1")));
      await engine.connect(addr1).createAsyncBranch(addr1.address, 2, ethers.keccak256(ethers.toUtf8Bytes("addr1-tx2")));
    });

    it("Should batch settle multiple users' async nonces", async function () {
      const senders = [owner.address, addr1.address];
      const nonces = [2, 2];
      
      // Owner settles their own, addr1 settles their own
      await expect(engine.batchSettleAsync(senders, nonces))
        .to.emit(engine, "BatchSettlementCompleted")
        .withArgs(owner.address, 2, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));
      
      // Verify both settled
      expect(await engine.getLastSettledNonce(owner.address)).to.equal(2);
      expect(await engine.getLastSettledNonce(addr1.address)).to.equal(2);
    });

    it("Should skip already settled nonces in batch", async function () {
      // Settle owner's nonce 2 first
      await engine.settleAsync(2);
      
      const senders = [owner.address, addr1.address];
      const nonces = [2, 2];
      
      // Batch should skip owner's already-settled nonce
      await expect(engine.batchSettleAsync(senders, nonces))
        .to.not.be.reverted;
      
      // addr1's nonce should be settled
      expect(await engine.getLastSettledNonce(addr1.address)).to.equal(2);
    });

    it("Should revert with mismatched array lengths", async function () {
      const senders = [owner.address];
      const nonces = [1, 2];
      
      await expect(engine.batchSettleAsync(senders, nonces))
        .to.be.revertedWith("Array length mismatch");
    });

    it("Should revert with empty batch", async function () {
      await expect(engine.batchSettleAsync([], []))
        .to.be.revertedWith("Empty batch");
    });
  });

  describe("Pending Nonces Query", function () {
    it("Should return all pending nonces for an address", async function () {
      await engine.createAsyncBranch(owner.address, 1, ethers.keccak256(ethers.toUtf8Bytes("tx1")));
      await engine.createAsyncBranch(owner.address, 2, ethers.keccak256(ethers.toUtf8Bytes("tx2")));
      await engine.createAsyncBranch(owner.address, 3, ethers.keccak256(ethers.toUtf8Bytes("tx3")));
      
      const pendingNonces = await engine.getPendingNonces(owner.address);
      expect(pendingNonces.length).to.equal(3);
      expect(pendingNonces).to.deep.equal([1n, 2n, 3n]);
    });

    it("Should return empty array if no pending nonces", async function () {
      const pendingNonces = await engine.getPendingNonces(owner.address);
      expect(pendingNonces.length).to.equal(0);
    });

    it("Should update after settlement", async function () {
      await engine.createAsyncBranch(owner.address, 1, ethers.keccak256(ethers.toUtf8Bytes("tx1")));
      await engine.createAsyncBranch(owner.address, 2, ethers.keccak256(ethers.toUtf8Bytes("tx2")));
      await engine.createAsyncBranch(owner.address, 3, ethers.keccak256(ethers.toUtf8Bytes("tx3")));
      
      await engine.settleAsync(2);
      
      const pendingNonces = await engine.getPendingNonces(owner.address);
      expect(pendingNonces.length).to.equal(1);
      expect(pendingNonces[0]).to.equal(3);
    });
  });

  describe("Multiple Contract Authorization", function () {
    let addr2;

    beforeEach(async function () {
      [owner, addr1, addr2] = await ethers.getSigners();
    });

    it("Should allow multiple contracts to be authorized", async function () {
      await engine.setAuthorizedContract(addr1.address, true);
      await engine.setAuthorizedContract(addr2.address, true);
      
      expect(await engine.authorizedContracts(addr1.address)).to.be.true;
      expect(await engine.authorizedContracts(addr2.address)).to.be.true;
    });

    it("Should allow revoking authorization", async function () {
      await engine.setAuthorizedContract(addr1.address, true);
      expect(await engine.authorizedContracts(addr1.address)).to.be.true;
      
      await engine.setAuthorizedContract(addr1.address, false);
      expect(await engine.authorizedContracts(addr1.address)).to.be.false;
    });

    it("Should prevent revoked contract from creating branches", async function () {
      await engine.setAuthorizedContract(addr1.address, true);
      await engine.setAuthorizedContract(addr1.address, false);
      
      await expect(
        engine.connect(addr1).createAsyncBranch(addr1.address, 1, ethers.keccak256(ethers.toUtf8Bytes("tx1")))
      ).to.be.revertedWithCustomError(engine, "NotAuthorized");
    });
  });

  describe("Large-Scale Parallel Execution Simulation", function () {
    it("Should handle 100+ concurrent async nonces", async function () {
      const numNonces = 100;
      
      for (let i = 1; i <= numNonces; i++) {
        await engine.createAsyncBranch(
          owner.address,
          i,
          ethers.keccak256(ethers.toUtf8Bytes(`tx${i}`))
        );
      }
      
      expect(await engine.hasPendingAsync(owner.address)).to.be.true;
      
      const pendingNonces = await engine.getPendingNonces(owner.address);
      expect(pendingNonces.length).to.equal(numNonces);
      
      // Settle a middle nonce
      await engine.settleAsync(50);
      
      const remainingNonces = await engine.getPendingNonces(owner.address);
      expect(remainingNonces.length).to.equal(50); // 51-100
    });
  });
});