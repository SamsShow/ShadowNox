const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * AtomicCounter Tests
 * 
 * Tests Arcology-optimized atomic counter for parallel execution
 * - Thread-safe increment/decrement operations
 * - Overflow/underflow protection
 * - Gas efficiency analysis
 */
describe("AtomicCounter", function () {
  let atomicCounter;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const AtomicCounterFactory = await ethers.getContractFactory("AtomicCounter");
    atomicCounter = await AtomicCounterFactory.deploy();
    await atomicCounter.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should initialize counter to 0", async function () {
      expect(await atomicCounter.current()).to.equal(0);
    });

    it("Should set the deployer as owner", async function () {
      expect(await atomicCounter.owner()).to.equal(owner.address);
    });
  });

  describe("Increment Operations", function () {
    it("Should increment counter by specified delta", async function () {
      await atomicCounter.increment(5);
      expect(await atomicCounter.current()).to.equal(5);
      
      await atomicCounter.increment(10);
      expect(await atomicCounter.current()).to.equal(15);
    });

    it("Should emit Incremented event", async function () {
      await expect(atomicCounter.increment(100))
        .to.emit(atomicCounter, "Incremented")
        .withArgs(100, 100);
    });

    it("Should revert if non-owner tries to increment", async function () {
      await expect(atomicCounter.connect(addr1).increment(5))
        .to.be.revertedWithCustomError(atomicCounter, "Unauthorized");
    });

    it("Should handle large increments", async function () {
      const largeValue = ethers.parseEther("1000000");
      await atomicCounter.increment(largeValue);
      expect(await atomicCounter.current()).to.equal(largeValue);
    });

    it("Should prevent overflow", async function () {
      const maxUint256 = ethers.MaxUint256;
      await atomicCounter.set(maxUint256);
      
      await expect(atomicCounter.increment(1))
        .to.be.revertedWithCustomError(atomicCounter, "Overflow");
    });
  });

  describe("Decrement Operations", function () {
    beforeEach(async function () {
      await atomicCounter.increment(100);
    });

    it("Should decrement counter by specified delta", async function () {
      await atomicCounter.decrement(30);
      expect(await atomicCounter.current()).to.equal(70);
      
      await atomicCounter.decrement(20);
      expect(await atomicCounter.current()).to.equal(50);
    });

    it("Should emit Decremented event", async function () {
      await expect(atomicCounter.decrement(50))
        .to.emit(atomicCounter, "Decremented")
        .withArgs(50, 50);
    });

    it("Should prevent underflow", async function () {
      await expect(atomicCounter.decrement(101))
        .to.be.revertedWithCustomError(atomicCounter, "Underflow");
    });

    it("Should allow decrementing to zero", async function () {
      await atomicCounter.decrement(100);
      expect(await atomicCounter.current()).to.equal(0);
    });

    it("Should revert if non-owner tries to decrement", async function () {
      await expect(atomicCounter.connect(addr1).decrement(5))
        .to.be.revertedWithCustomError(atomicCounter, "Unauthorized");
    });
  });

  describe("Reset and Set Operations", function () {
    beforeEach(async function () {
      await atomicCounter.increment(500);
    });

    it("Should reset counter to zero", async function () {
      await atomicCounter.reset();
      expect(await atomicCounter.current()).to.equal(0);
    });

    it("Should emit Reset event", async function () {
      await expect(atomicCounter.reset())
        .to.emit(atomicCounter, "Reset")
        .withArgs(500);
    });

    it("Should set counter to specific value", async function () {
      await atomicCounter.set(1000);
      expect(await atomicCounter.current()).to.equal(1000);
    });

    it("Should allow setting to zero", async function () {
      await atomicCounter.set(0);
      expect(await atomicCounter.current()).to.equal(0);
    });

    it("Should revert if non-owner tries to reset", async function () {
      await expect(atomicCounter.connect(addr1).reset())
        .to.be.revertedWithCustomError(atomicCounter, "Unauthorized");
    });

    it("Should revert if non-owner tries to set", async function () {
      await expect(atomicCounter.connect(addr1).set(100))
        .to.be.revertedWithCustomError(atomicCounter, "Unauthorized");
    });
  });

  describe("Ownership", function () {
    it("Should transfer ownership", async function () {
      await atomicCounter.transferOwnership(addr1.address);
      expect(await atomicCounter.owner()).to.equal(addr1.address);
    });

    it("Should allow new owner to increment", async function () {
      await atomicCounter.transferOwnership(addr1.address);
      await atomicCounter.connect(addr1).increment(10);
      expect(await atomicCounter.current()).to.equal(10);
    });

    it("Should prevent previous owner from incrementing after transfer", async function () {
      await atomicCounter.transferOwnership(addr1.address);
      await expect(atomicCounter.connect(owner).increment(10))
        .to.be.revertedWithCustomError(atomicCounter, "Unauthorized");
    });

    it("Should revert if transferring to zero address", async function () {
      await expect(atomicCounter.transferOwnership(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid owner");
    });

    it("Should revert if non-owner tries to transfer ownership", async function () {
      await expect(atomicCounter.connect(addr1).transferOwnership(addr2.address))
        .to.be.revertedWithCustomError(atomicCounter, "Unauthorized");
    });
  });

  describe("Parallel Execution Simulation", function () {
    it("Should handle multiple sequential increments (simulating parallel execution)", async function () {
      // Simulate multiple "parallel" transactions from Arcology
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(atomicCounter.increment(1));
      }
      
      await Promise.all(promises);
      expect(await atomicCounter.current()).to.equal(10);
    });

    it("Should handle mixed increment and decrement operations", async function () {
      await atomicCounter.increment(100);
      
      await atomicCounter.increment(50);
      await atomicCounter.decrement(30);
      await atomicCounter.increment(20);
      await atomicCounter.decrement(10);
      
      expect(await atomicCounter.current()).to.equal(130);
    });
  });

  describe("Gas Optimization Analysis", function () {
    it("Should record gas usage for increment operation", async function () {
      const tx = await atomicCounter.increment(1);
      const receipt = await tx.wait();
      
      console.log(`      Gas used for increment: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(100000); // Should be efficient
    });

    it("Should record gas usage for decrement operation", async function () {
      await atomicCounter.increment(100);
      
      const tx = await atomicCounter.decrement(50);
      const receipt = await tx.wait();
      
      console.log(`      Gas used for decrement: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(100000);
    });

    it("Should compare gas for large vs small increments", async function () {
      const smallTx = await atomicCounter.increment(1);
      const smallReceipt = await smallTx.wait();
      
      await atomicCounter.reset();
      
      const largeTx = await atomicCounter.increment(ethers.parseEther("1000000"));
      const largeReceipt = await largeTx.wait();
      
      console.log(`      Small increment gas: ${smallReceipt.gasUsed.toString()}`);
      console.log(`      Large increment gas: ${largeReceipt.gasUsed.toString()}`);
      
      // Gas should be similar regardless of value size
      const gasDiff = Math.abs(Number(smallReceipt.gasUsed) - Number(largeReceipt.gasUsed));
      expect(gasDiff).to.be.lessThan(5000);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle increment of zero", async function () {
      await atomicCounter.increment(0);
      expect(await atomicCounter.current()).to.equal(0);
    });

    it("Should handle decrement of zero", async function () {
      await atomicCounter.increment(10);
      await atomicCounter.decrement(0);
      expect(await atomicCounter.current()).to.equal(10);
    });

    it("Should handle maximum safe integer", async function () {
      const maxSafe = ethers.MaxUint256 - 1n;
      await atomicCounter.set(maxSafe);
      await atomicCounter.increment(1);
      expect(await atomicCounter.current()).to.equal(ethers.MaxUint256);
    });
  });
});


