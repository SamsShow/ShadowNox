const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * FisherRewards Tests
 * 
 * Tests Fisher bot reward system for EVVM transaction relay
 * - Reward recording and accumulation
 * - Claim mechanism with anti-spam protection
 * - Reward calculation algorithms
 * - Integration scenarios
 */
describe("FisherRewards", function () {
  let fisherRewards;
  let owner, fisher1, fisher2, fisher3;
  
  const INITIAL_POOL = ethers.parseEther("100");
  const MIN_CLAIM = ethers.parseEther("0.001");
  const COOLDOWN = 3600; // 1 hour

  beforeEach(async function () {
    [owner, fisher1, fisher2, fisher3] = await ethers.getSigners();
    
    const FisherRewardsFactory = await ethers.getContractFactory("FisherRewards");
    fisherRewards = await FisherRewardsFactory.deploy();
    await fisherRewards.waitForDeployment();
    
    // Fund reward pool
    await fisherRewards.fundRewardPool({ value: INITIAL_POOL });
  });

  describe("Deployment and Initialization", function () {
    it("Should set correct owner", async function () {
      expect(await fisherRewards.owner()).to.equal(owner.address);
    });

    it("Should initialize reward pool correctly", async function () {
      const [poolBalance, totalPaid] = await fisherRewards.getPoolStats();
      expect(poolBalance).to.equal(INITIAL_POOL);
      expect(totalPaid).to.equal(0);
    });

    it("Should set default parameters correctly", async function () {
      expect(await fisherRewards.minClaimAmount()).to.equal(MIN_CLAIM);
      expect(await fisherRewards.claimCooldown()).to.equal(COOLDOWN);
    });
  });

  describe("Fisher Registration", function () {
    it("Should allow Fisher to register", async function () {
      const tx = await fisherRewards.connect(fisher1).registerFisher();
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(fisherRewards, "FisherRegistered")
        .withArgs(fisher1.address, block.timestamp);
      
      const stats = await fisherRewards.getRewardStats(fisher1.address);
      expect(stats.isActive).to.be.true;
    });

    it("Should not duplicate registration", async function () {
      await fisherRewards.connect(fisher1).registerFisher();
      
      // Second registration should not emit event
      const tx = await fisherRewards.connect(fisher1).registerFisher();
      const receipt = await tx.wait();
      
      // Check that no FisherRegistered event was emitted
      const events = receipt.logs.filter(log => {
        try {
          const parsed = fisherRewards.interface.parseLog(log);
          return parsed.name === "FisherRegistered";
        } catch {
          return false;
        }
      });
      
      expect(events.length).to.equal(0);
    });

    it("Should allow multiple Fishers to register", async function () {
      await fisherRewards.connect(fisher1).registerFisher();
      await fisherRewards.connect(fisher2).registerFisher();
      await fisherRewards.connect(fisher3).registerFisher();
      
      const stats1 = await fisherRewards.getRewardStats(fisher1.address);
      const stats2 = await fisherRewards.getRewardStats(fisher2.address);
      const stats3 = await fisherRewards.getRewardStats(fisher3.address);
      
      expect(stats1.isActive).to.be.true;
      expect(stats2.isActive).to.be.true;
      expect(stats3.isActive).to.be.true;
    });
  });

  describe("Reward Recording", function () {
    const txHash = ethers.keccak256(ethers.toUtf8Bytes("transaction1"));
    const gasUsed = 100000;
    const complexity = 50;

    beforeEach(async function () {
      await fisherRewards.connect(fisher1).registerFisher();
    });

    it("Should record reward correctly", async function () {
      const expectedReward = await fisherRewards.calculateReward(gasUsed, complexity);
      
      const tx = await fisherRewards.recordReward(fisher1.address, txHash, gasUsed, complexity);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(fisherRewards, "RewardRecorded")
        .withArgs(fisher1.address, txHash, expectedReward, block.timestamp);
      
      const stats = await fisherRewards.getRewardStats(fisher1.address);
      expect(stats.pendingRewards).to.equal(expectedReward);
      expect(stats.totalRewards).to.equal(expectedReward);
      expect(stats.transactionCount).to.equal(1);
    });

    it("Should accumulate multiple rewards", async function () {
      const txHash1 = ethers.keccak256(ethers.toUtf8Bytes("tx1"));
      const txHash2 = ethers.keccak256(ethers.toUtf8Bytes("tx2"));
      const txHash3 = ethers.keccak256(ethers.toUtf8Bytes("tx3"));
      
      await fisherRewards.recordReward(fisher1.address, txHash1, gasUsed, complexity);
      await fisherRewards.recordReward(fisher1.address, txHash2, gasUsed, complexity);
      await fisherRewards.recordReward(fisher1.address, txHash3, gasUsed, complexity);
      
      const stats = await fisherRewards.getRewardStats(fisher1.address);
      expect(stats.transactionCount).to.equal(3);
    });

    it("Should track transaction to Fisher mapping", async function () {
      await fisherRewards.recordReward(fisher1.address, txHash, gasUsed, complexity);
      
      const fisher = await fisherRewards.getTxFisher(txHash);
      expect(fisher).to.equal(fisher1.address);
    });

    it("Should revert if Fisher is not active", async function () {
      await expect(
        fisherRewards.recordReward(fisher2.address, txHash, gasUsed, complexity)
      ).to.be.revertedWithCustomError(fisherRewards, "FisherNotActive");
    });

    it("Should revert if reward pool is insufficient", async function () {
      // Drain the pool
      const [poolBalance] = await fisherRewards.getPoolStats();
      const atomicCounter = await ethers.getContractAt(
        "AtomicCounter",
        await fisherRewards.totalRewardPool()
      );
      
      // Set a reward that exceeds pool
      await fisherRewards.updateRewardParameters(
        ethers.parseEther("200"), // Huge base reward
        1,
        0
      );
      
      await expect(
        fisherRewards.recordReward(fisher1.address, txHash, gasUsed, complexity)
      ).to.be.revertedWithCustomError(fisherRewards, "InsufficientRewardPool");
    });
  });

  describe("Reward Calculation", function () {
    it("Should calculate base reward correctly", async function () {
      const baseRate = await fisherRewards.baseRewardRate();
      const reward = await fisherRewards.calculateReward(0, 0);
      expect(reward).to.equal(baseRate);
    });

    it("Should add complexity bonus for high complexity", async function () {
      const rewardLow = await fisherRewards.calculateReward(100000, 30);
      const rewardHigh = await fisherRewards.calculateReward(100000, 60);
      
      expect(rewardHigh).to.be.greaterThan(rewardLow);
    });

    it("Should scale with gas usage", async function () {
      const reward1 = await fisherRewards.calculateReward(50000, 50);
      const reward2 = await fisherRewards.calculateReward(100000, 50);
      
      expect(reward2).to.be.greaterThan(reward1);
    });
  });

  describe("Claiming Rewards", function () {
    beforeEach(async function () {
      await fisherRewards.connect(fisher1).registerFisher();
      
      // Record enough rewards to claim
      for (let i = 0; i < 10; i++) {
        const txHash = ethers.keccak256(ethers.toUtf8Bytes(`tx${i}`));
        await fisherRewards.recordReward(fisher1.address, txHash, 100000, 50);
      }
    });

    it("Should allow Fisher to claim rewards", async function () {
      const statsBefore = await fisherRewards.getRewardStats(fisher1.address);
      const pendingBefore = statsBefore.pendingRewards;
      
      await expect(fisherRewards.connect(fisher1).claimRewards())
        .to.emit(fisherRewards, "RewardsClaimed");
      
      const statsAfter = await fisherRewards.getRewardStats(fisher1.address);
      expect(statsAfter.pendingRewards).to.equal(0);
      expect(statsAfter.claimedRewards).to.equal(pendingBefore);
    });

    it("Should transfer funds to Fisher", async function () {
      const statsBefore = await fisherRewards.getRewardStats(fisher1.address);
      const balanceBefore = await ethers.provider.getBalance(fisher1.address);
      
      const tx = await fisherRewards.connect(fisher1).claimRewards();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(fisher1.address);
      const expectedBalance = balanceBefore + statsBefore.pendingRewards - gasCost;
      
      expect(balanceAfter).to.equal(expectedBalance);
    });

    it("Should update reward pool after claim", async function () {
      const statsBefore = await fisherRewards.getRewardStats(fisher1.address);
      const [poolBefore] = await fisherRewards.getPoolStats();
      
      await fisherRewards.connect(fisher1).claimRewards();
      
      const [poolAfter] = await fisherRewards.getPoolStats();
      expect(poolAfter).to.equal(poolBefore - statsBefore.pendingRewards);
    });

    it("Should enforce minimum claim amount", async function () {
      await fisherRewards.connect(fisher2).registerFisher();
      
      // Record small reward below minimum
      const txHash = ethers.keccak256(ethers.toUtf8Bytes("smalltx"));
      await fisherRewards.updateRewardParameters(
        ethers.parseEther("0.0001"),
        1,
        0
      );
      await fisherRewards.recordReward(fisher2.address, txHash, 1000, 10);
      
      await expect(
        fisherRewards.connect(fisher2).claimRewards()
      ).to.be.revertedWithCustomError(fisherRewards, "BelowMinClaimAmount");
    });

    it("Should enforce claim cooldown", async function () {
      await fisherRewards.connect(fisher1).claimRewards();
      
      // Record more rewards for second claim
      for (let i = 10; i < 20; i++) {
        const txHash = ethers.keccak256(ethers.toUtf8Bytes(`tx${i}`));
        await fisherRewards.recordReward(fisher1.address, txHash, 100000, 50);
      }
      
      // Try to claim again immediately (should fail due to cooldown)
      await expect(
        fisherRewards.connect(fisher1).claimRewards()
      ).to.be.revertedWithCustomError(fisherRewards, "ClaimCooldownActive");
    });

    it("Should allow claim after cooldown period", async function () {
      await fisherRewards.connect(fisher1).claimRewards();
      
      // Record more rewards
      for (let i = 10; i < 20; i++) {
        const txHash = ethers.keccak256(ethers.toUtf8Bytes(`tx${i}`));
        await fisherRewards.recordReward(fisher1.address, txHash, 100000, 50);
      }
      
      // Advance time past cooldown
      await time.increase(COOLDOWN + 1);
      
      await expect(fisherRewards.connect(fisher1).claimRewards())
        .to.not.be.reverted;
    });

    it("Should revert if no rewards to claim", async function () {
      await fisherRewards.connect(fisher1).claimRewards();
      
      await time.increase(COOLDOWN + 1);
      
      await expect(
        fisherRewards.connect(fisher1).claimRewards()
      ).to.be.revertedWithCustomError(fisherRewards, "NoRewardsToClaim");
    });

    it("Should revert if Fisher is not active", async function () {
      await expect(
        fisherRewards.connect(fisher2).claimRewards()
      ).to.be.revertedWithCustomError(fisherRewards, "FisherNotActive");
    });
  });

  describe("Pool Management", function () {
    it("Should allow funding reward pool", async function () {
      const fundAmount = ethers.parseEther("50");
      
      await expect(fisherRewards.fundRewardPool({ value: fundAmount }))
        .to.emit(fisherRewards, "RewardPoolFunded")
        .withArgs(fundAmount, await time.latest() + 1);
      
      const [poolBalance] = await fisherRewards.getPoolStats();
      expect(poolBalance).to.equal(INITIAL_POOL + fundAmount);
    });

    it("Should accept direct ETH transfers", async function () {
      const sendAmount = ethers.parseEther("10");
      
      await owner.sendTransaction({
        to: await fisherRewards.getAddress(),
        value: sendAmount
      });
      
      const [poolBalance] = await fisherRewards.getPoolStats();
      expect(poolBalance).to.equal(INITIAL_POOL + sendAmount);
    });
  });

  describe("Parameter Updates", function () {
    it("Should allow owner to update reward parameters", async function () {
      const newBase = ethers.parseEther("0.0005");
      const newGas = 2;
      const newBonus = ethers.parseEther("0.0002");
      
      await expect(
        fisherRewards.updateRewardParameters(newBase, newGas, newBonus)
      ).to.emit(fisherRewards, "RewardParametersUpdated")
        .withArgs(newBase, newGas, newBonus);
      
      expect(await fisherRewards.baseRewardRate()).to.equal(newBase);
      expect(await fisherRewards.gasMultiplier()).to.equal(newGas);
      expect(await fisherRewards.complexityBonus()).to.equal(newBonus);
    });

    it("Should prevent invalid parameter updates", async function () {
      await expect(
        fisherRewards.updateRewardParameters(0, 1, 0)
      ).to.be.revertedWithCustomError(fisherRewards, "InvalidParameters");
      
      await expect(
        fisherRewards.updateRewardParameters(100, 0, 0)
      ).to.be.revertedWithCustomError(fisherRewards, "InvalidParameters");
    });

    it("Should allow owner to update claim parameters", async function () {
      const newMin = ethers.parseEther("0.01");
      const newCooldown = 7200; // 2 hours
      
      await fisherRewards.updateClaimParameters(newMin, newCooldown);
      
      expect(await fisherRewards.minClaimAmount()).to.equal(newMin);
      expect(await fisherRewards.claimCooldown()).to.equal(newCooldown);
    });

    it("Should prevent non-owner from updating parameters", async function () {
      await expect(
        fisherRewards.connect(fisher1).updateRewardParameters(100, 1, 0)
      ).to.be.revertedWithCustomError(fisherRewards, "NotOwner");
      
      await expect(
        fisherRewards.connect(fisher1).updateClaimParameters(100, 100)
      ).to.be.revertedWithCustomError(fisherRewards, "NotOwner");
    });
  });

  describe("Multiple Fisher Scenarios", function () {
    beforeEach(async function () {
      await fisherRewards.connect(fisher1).registerFisher();
      await fisherRewards.connect(fisher2).registerFisher();
      await fisherRewards.connect(fisher3).registerFisher();
    });

    it("Should track rewards independently for each Fisher", async function () {
      // Fisher 1: 5 transactions
      for (let i = 0; i < 5; i++) {
        const txHash = ethers.keccak256(ethers.toUtf8Bytes(`f1-tx${i}`));
        await fisherRewards.recordReward(fisher1.address, txHash, 100000, 50);
      }
      
      // Fisher 2: 10 transactions
      for (let i = 0; i < 10; i++) {
        const txHash = ethers.keccak256(ethers.toUtf8Bytes(`f2-tx${i}`));
        await fisherRewards.recordReward(fisher2.address, txHash, 100000, 50);
      }
      
      const stats1 = await fisherRewards.getRewardStats(fisher1.address);
      const stats2 = await fisherRewards.getRewardStats(fisher2.address);
      
      expect(stats1.transactionCount).to.equal(5);
      expect(stats2.transactionCount).to.equal(10);
      expect(stats2.pendingRewards).to.be.greaterThan(stats1.pendingRewards);
    });

    it("Should allow concurrent claims from different Fishers", async function () {
      // Record rewards for both
      for (let i = 0; i < 10; i++) {
        const txHash1 = ethers.keccak256(ethers.toUtf8Bytes(`f1-tx${i}`));
        const txHash2 = ethers.keccak256(ethers.toUtf8Bytes(`f2-tx${i}`));
        await fisherRewards.recordReward(fisher1.address, txHash1, 100000, 50);
        await fisherRewards.recordReward(fisher2.address, txHash2, 100000, 50);
      }
      
      // Check rewards are above minimum
      const stats1Before = await fisherRewards.getRewardStats(fisher1.address);
      const stats2Before = await fisherRewards.getRewardStats(fisher2.address);
      
      expect(stats1Before.pendingRewards).to.be.greaterThan(await fisherRewards.minClaimAmount());
      expect(stats2Before.pendingRewards).to.be.greaterThan(await fisherRewards.minClaimAmount());
      
      // Both should be able to claim
      await expect(fisherRewards.connect(fisher1).claimRewards()).to.not.be.reverted;
      await expect(fisherRewards.connect(fisher2).claimRewards()).to.not.be.reverted;
      
      const stats1 = await fisherRewards.getRewardStats(fisher1.address);
      const stats2 = await fisherRewards.getRewardStats(fisher2.address);
      
      expect(stats1.pendingRewards).to.equal(0);
      expect(stats2.pendingRewards).to.equal(0);
      expect(stats1.claimedRewards).to.be.greaterThan(0);
      expect(stats2.claimedRewards).to.be.greaterThan(0);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to emergency withdraw", async function () {
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await fisherRewards.getAddress());
      
      const tx = await fisherRewards.emergencyWithdraw();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + contractBalance - gasCost);
    });

    it("Should prevent non-owner from emergency withdraw", async function () {
      await expect(
        fisherRewards.connect(fisher1).emergencyWithdraw()
      ).to.be.revertedWithCustomError(fisherRewards, "NotOwner");
    });
  });
});


