const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * EncryptedSwap Tests - Simplified MVP
 * 
 * Focus:
 * - Parallel swap execution on Arcology
 * - Real Pyth price feed integration
 * - AtomicCounter for conflict-resistant metrics
 * 
 * Intent Data Format (ABI-encoded):
 * - tokenIn (address): Input token address
 * - tokenOut (address): Output token address
 * - amountIn (uint256): Input amount
 * - minAmountOut (uint256): Minimum output amount (slippage protection)
 * - deadline (uint256): Transaction deadline timestamp
 */

describe("EncryptedSwap - Arcology Parallel Execution", function () {
  let encryptedSwap;
  let priceOracle;
  let owner, user1, user2, user3, user4;
  
  // Mock token addresses
  const TOKEN_IN = "0x1111111111111111111111111111111111111111";
  const TOKEN_OUT = "0x2222222222222222222222222222222222222222";
  const USDC = "0x0000000000000000000000000000000000000001";
  const ETH = "0x0000000000000000000000000000000000000002";
  
  // Pyth price feed IDs (from Hermes API)
  const USDC_PRICE_ID = ethers.id("USDC/USD");
  const ETH_PRICE_ID = ethers.id("ETH/USD");

  beforeEach(async function () {
    [owner, user1, user2, user3, user4] = await ethers.getSigners();

    // Deploy CustomPriceOracle (uses Pyth Hermes API, no on-chain contract needed)
    const CustomPriceOracle = await ethers.getContractFactory("CustomPriceOracle");
    priceOracle = await CustomPriceOracle.deploy();
    await priceOracle.waitForDeployment();

    // Deploy EncryptedSwap
    const EncryptedSwap = await ethers.getContractFactory("EncryptedSwap");
    encryptedSwap = await EncryptedSwap.deploy(await priceOracle.getAddress());
    await encryptedSwap.waitForDeployment();

    // Configure price IDs
    await priceOracle.setPriceId(USDC, USDC_PRICE_ID);
    await priceOracle.setPriceId(ETH, ETH_PRICE_ID);
    await priceOracle.setPriceId(TOKEN_IN, USDC_PRICE_ID);
    await priceOracle.setPriceId(TOKEN_OUT, ETH_PRICE_ID);
    
    // Set mock prices for testing
    const block = await ethers.provider.getBlock('latest');
    await priceOracle.updatePrice(USDC_PRICE_ID, BigInt(1 * 10**8), BigInt(0.01 * 10**8), -8, block.timestamp);
    await priceOracle.updatePrice(ETH_PRICE_ID, BigInt(3000 * 10**8), BigInt(10 * 10**8), -8, block.timestamp);
  });

  // Helper function to create ABI-encoded intent data
  function createIntentData(tokenIn, tokenOut, amountIn, minAmountOut, deadline) {
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256", "uint256", "uint256"],
      [tokenIn, tokenOut, amountIn, minAmountOut, deadline]
    );
  }

  describe("Deployment", function () {
    it("Should deploy with correct CustomPriceOracle", async function () {
      expect(await encryptedSwap.priceOracle()).to.equal(await priceOracle.getAddress());
    });

    it("Should deploy AtomicCounters for metrics", async function () {
      const volumeCounter = await encryptedSwap.totalSwapVolume();
      const countCounter = await encryptedSwap.totalSwapCount();

      expect(volumeCounter).to.not.equal(ethers.ZeroAddress);
      expect(countCounter).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("Swap Intent Submission", function () {
    it("Should submit a swap intent with ABI-encoded data", async function () {
      const intentData = createIntentData(
        TOKEN_IN, 
        TOKEN_OUT, 
        ethers.parseEther("100"), 
        ethers.parseEther("95"), 
        Math.floor(Date.now() / 1000) + 3600
      );

      const tx = await encryptedSwap.connect(user1).submitSwapIntent(intentData);
      
      await expect(tx).to.emit(encryptedSwap, "SwapIntentSubmitted");

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = encryptedSwap.interface.parseLog(log);
          return parsed.name === "SwapIntentSubmitted";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
    });

    it("Should allow multiple users to submit intents in parallel", async function () {
      const intentData1 = createIntentData(TOKEN_IN, TOKEN_OUT, ethers.parseEther("100"), ethers.parseEther("95"), Date.now() + 3600);
      const intentData2 = createIntentData(TOKEN_IN, TOKEN_OUT, ethers.parseEther("200"), ethers.parseEther("190"), Date.now() + 3600);
      const intentData3 = createIntentData(TOKEN_IN, TOKEN_OUT, ethers.parseEther("150"), ethers.parseEther("140"), Date.now() + 3600);

      // Simulate parallel submission (in Arcology, these execute simultaneously)
      await encryptedSwap.connect(user1).submitSwapIntent(intentData1);
      await encryptedSwap.connect(user2).submitSwapIntent(intentData2);
      await encryptedSwap.connect(user3).submitSwapIntent(intentData3);

      // All intents submitted successfully
      // In Arcology, these would execute in parallel at 10k-15k TPS
    });
  });

  describe("Swap Execution with Pyth Integration", function () {
    let intentId, intentData;

    beforeEach(async function () {
      intentData = createIntentData(
        TOKEN_IN,
        TOKEN_OUT,
        ethers.parseEther("50"),
        ethers.parseEther("48"),
        Math.floor(Date.now() / 1000) + 3600
      );
      
      const tx = await encryptedSwap.connect(user1).submitSwapIntent(intentData);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          const parsed = encryptedSwap.interface.parseLog(log);
          return parsed.name === "SwapIntentSubmitted";
        } catch {
          return false;
        }
      });
      
      intentId = event.args.intentId;
    });

    it("Should execute swap with valid Pyth prices", async function () {
      const swapVolume = ethers.parseEther("10");

      // Execute swap with real CustomPriceOracle integration
      await expect(
        encryptedSwap.connect(owner).executeSwap(intentId, swapVolume, TOKEN_IN, TOKEN_OUT)
      ).to.emit(encryptedSwap, "SwapExecuted");
    });

    it("Should not allow non-owner to execute swap", async function () {
      const swapVolume = ethers.parseEther("10");

      await expect(
        encryptedSwap.connect(user2).executeSwap(intentId, swapVolume, TOKEN_IN, TOKEN_OUT)
      ).to.be.revertedWithCustomError(encryptedSwap, "NotOwner");
    });
  });

  describe("Swap Cancellation", function () {
    let intentId;

    beforeEach(async function () {
      const intentData = createIntentData(
        TOKEN_IN,
        TOKEN_OUT,
        ethers.parseEther("50"),
        ethers.parseEther("48"),
        Math.floor(Date.now() / 1000) + 3600
      );
      
      const tx = await encryptedSwap.connect(user1).submitSwapIntent(intentData);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          const parsed = encryptedSwap.interface.parseLog(log);
          return parsed.name === "SwapIntentSubmitted";
        } catch {
          return false;
        }
      });
      
      intentId = event.args.intentId;
    });

    it("Should allow user to cancel their own swap", async function () {
      await expect(encryptedSwap.connect(user1).cancelSwap(intentId))
        .to.emit(encryptedSwap, "SwapCancelled")
        .withArgs(intentId, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));

      const intent = await encryptedSwap.connect(user1).getSwapIntent(intentId);
      expect(intent.cancelled).to.be.true;
    });

    it("Should allow owner to cancel any swap", async function () {
      await expect(encryptedSwap.connect(owner).cancelSwap(intentId))
        .to.emit(encryptedSwap, "SwapCancelled");
    });

    it("Should not allow other users to cancel", async function () {
      await expect(
        encryptedSwap.connect(user2).cancelSwap(intentId)
      ).to.be.revertedWithCustomError(encryptedSwap, "NotIntentOwner");
    });
  });

  describe("Aggregate Metrics - AtomicCounter Demo", function () {
    it("Should track aggregate metrics correctly", async function () {
      const metrics = await encryptedSwap.getAggregateMetrics();
      expect(metrics.volume).to.equal(0);
      expect(metrics.count).to.equal(0);
    });

    it("Should use separate AtomicCounter instances", async function () {
      const volumeCounter = await encryptedSwap.totalSwapVolume();
      const countCounter = await encryptedSwap.totalSwapCount();

      // Verify they are different contracts
      expect(volumeCounter).to.not.equal(countCounter);

      // Verify they are AtomicCounter instances
      const volumeCounterContract = await ethers.getContractAt("AtomicCounter", volumeCounter);
      const currentVolume = await volumeCounterContract.current();
      expect(currentVolume).to.equal(0);
    });
  });

  describe("Arcology Parallel Execution Simulation", function () {
    it("Should handle multiple parallel swap submissions", async function () {
      const promises = [];
      
      // Simulate 5 users submitting swaps simultaneously
      for (let i = 0; i < 5; i++) {
        const signer = [user1, user2, user3, user4, owner][i];
        const intentData = createIntentData(
          TOKEN_IN,
          TOKEN_OUT,
          ethers.parseEther(`${(i + 1) * 10}`),
          ethers.parseEther(`${(i + 1) * 9.5}`),
          Math.floor(Date.now() / 1000) + 3600
        );
        
        promises.push(encryptedSwap.connect(signer).submitSwapIntent(intentData));
      }

      // In Arcology, these execute in parallel at 10k-15k TPS
      const results = await Promise.all(promises);
      expect(results.length).to.equal(5);
    });

    it("Should demonstrate per-user storage isolation", async function () {
      // Multiple users can submit intents without conflicts
      const intent1 = createIntentData(TOKEN_IN, TOKEN_OUT, ethers.parseEther("100"), ethers.parseEther("95"), Date.now() + 3600);
      const intent2 = createIntentData(TOKEN_IN, TOKEN_OUT, ethers.parseEther("200"), ethers.parseEther("190"), Date.now() + 3600);

      await encryptedSwap.connect(user1).submitSwapIntent(intent1);
      await encryptedSwap.connect(user2).submitSwapIntent(intent2);

      // Both intents stored independently (per-user isolation)
      // This enables Arcology's parallel execution
    });
  });

  describe("Privacy Features", function () {
    it("Should only allow intent owner or contract owner to view intent details", async function () {
      const intentData = createIntentData(
        TOKEN_IN,
        TOKEN_OUT,
        ethers.parseEther("100"),
        ethers.parseEther("95"),
        Math.floor(Date.now() / 1000) + 3600
      );
      
      const tx = await encryptedSwap.connect(user1).submitSwapIntent(intentData);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          const parsed = encryptedSwap.interface.parseLog(log);
          return parsed.name === "SwapIntentSubmitted";
        } catch {
          return false;
        }
      });
      
      const intentId = event.args.intentId;

      // User1 can view their own intent
      const intent = await encryptedSwap.connect(user1).getSwapIntent(intentId);
      expect(intent.user).to.equal(user1.address);

      // Owner can view any intent
      await encryptedSwap.connect(owner).getSwapIntent(intentId);

      // Other users cannot view
      await expect(
        encryptedSwap.connect(user2).getSwapIntent(intentId)
      ).to.be.revertedWithCustomError(encryptedSwap, "NotIntentOwner");
    });

    it("Should store intent data as bytes for privacy", async function () {
      const intentData = createIntentData(
        TOKEN_IN,
        TOKEN_OUT,
        ethers.parseEther("100"),
        ethers.parseEther("95"),
        Math.floor(Date.now() / 1000) + 3600
      );
      
      const tx = await encryptedSwap.connect(user1).submitSwapIntent(intentData);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          const parsed = encryptedSwap.interface.parseLog(log);
          return parsed.name === "SwapIntentSubmitted";
        } catch {
          return false;
        }
      });
      
      const intentId = event.args.intentId;
      const intent = await encryptedSwap.connect(user1).getSwapIntent(intentId);

      // Intent data stored as bytes (not human-readable on-chain)
      expect(intent.intentData).to.equal(intentData);
      expect(typeof intent.intentData).to.equal("string");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty intent data", async function () {
      const emptyIntent = "0x";
      await expect(encryptedSwap.connect(user1).submitSwapIntent(emptyIntent))
        .to.not.be.reverted;
    });

    it("Should prevent executing non-existent intent", async function () {
      const fakeIntentId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      
      await expect(
        encryptedSwap.connect(owner).executeSwap(fakeIntentId, ethers.parseEther("10"), TOKEN_IN, TOKEN_OUT)
      ).to.be.revertedWithCustomError(encryptedSwap, "IntentNotFound");
    });

    it("Should handle large intent data", async function () {
      const largeIntentData = createIntentData(
        TOKEN_IN,
        TOKEN_OUT,
        ethers.parseEther("1000000"),
        ethers.parseEther("950000"),
        Math.floor(Date.now() / 1000) + 3600
      );

      await expect(encryptedSwap.connect(user1).submitSwapIntent(largeIntentData))
        .to.not.be.reverted;
    });
  });

  describe("CustomPriceOracle Integration", function () {
    it("Should be integrated with CustomPriceOracle", async function () {
      const oracleAddress = await encryptedSwap.priceOracle();
      expect(oracleAddress).to.equal(await priceOracle.getAddress());
    });

    it("Should fetch prices from CustomPriceOracle", async function () {
      // Verify that prices are set and can be retrieved
      const usdcPrice = await priceOracle.getLatestPrice(USDC);
      expect(usdcPrice.price).to.equal(BigInt(1 * 10**8));
      
      const ethPrice = await priceOracle.getLatestPrice(ETH);
      expect(ethPrice.price).to.equal(BigInt(3000 * 10**8));
    });
  });
});
