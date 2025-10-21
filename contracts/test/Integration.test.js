const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Integration Tests
 * 
 * Tests full Shadow Economy contract integration on Arcology
 * - Complete flow: Submit intent → AsyncNonce → Execute → Reward Fisher
 * - Parallel execution scenarios
 * - Cross-contract interactions
 * - Bot integration patterns
 */
describe("Integration Tests", function () {
  let asyncNonceEngine, encryptedSwap, fisherRewards, shadowVault, pythAdapter, mockPyth;
  let owner, relayer, fisher, user1, user2, user3;
  
  const REWARD_POOL = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, relayer, fisher, user1, user2, user3] = await ethers.getSigners();

    // Deploy AsyncNonceEngine
    const AsyncNonceEngineFactory = await ethers.getContractFactory("AsyncNonceEngine");
    asyncNonceEngine = await AsyncNonceEngineFactory.deploy();
    await asyncNonceEngine.waitForDeployment();

    // Deploy EncryptedSwap
    const EncryptedSwapFactory = await ethers.getContractFactory("EncryptedSwap");
    encryptedSwap = await EncryptedSwapFactory.connect(relayer).deploy(
      await asyncNonceEngine.getAddress()
    );
    await encryptedSwap.waitForDeployment();

    // Authorize EncryptedSwap in AsyncNonceEngine
    await asyncNonceEngine.setAuthorizedContract(await encryptedSwap.getAddress(), true);

    // Deploy FisherRewards
    const FisherRewardsFactory = await ethers.getContractFactory("FisherRewards");
    fisherRewards = await FisherRewardsFactory.deploy();
    await fisherRewards.waitForDeployment();
    
    // Fund reward pool
    await fisherRewards.fundRewardPool({ value: REWARD_POOL });
    
    // Register Fisher bot
    await fisherRewards.connect(fisher).registerFisher();

    // Link FisherRewards to EncryptedSwap
    await encryptedSwap.connect(relayer).setFisherRewards(await fisherRewards.getAddress());

    // Deploy ShadowVault
    const ShadowVaultFactory = await ethers.getContractFactory("ShadowVault");
    shadowVault = await ShadowVaultFactory.deploy();
    await shadowVault.waitForDeployment();

    // Deploy MockPyth
    const MockPythFactory = await ethers.getContractFactory("MockPyth");
    mockPyth = await MockPythFactory.deploy();
    await mockPyth.waitForDeployment();

    // Deploy PythAdapter
    const PythAdapterFactory = await ethers.getContractFactory("PythAdapter");
    pythAdapter = await PythAdapterFactory.deploy(await mockPyth.getAddress());
    await pythAdapter.waitForDeployment();
  });

  // Helper to create ABI-encoded intent data
  function createIntentData(tokenIn, tokenOut, amountIn, minAmountOut, deadline) {
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256", "uint256", "uint256"],
      [tokenIn, tokenOut, amountIn, minAmountOut, deadline]
    );
  }

  describe("Full Swap Flow: Submit → Execute → Reward", function () {
    it("Should complete full private swap flow with Fisher reward", async function () {
      // 1. User submits private swap intent with ABI-encoded data
      const TOKEN_IN = "0x1111111111111111111111111111111111111111";
      const TOKEN_OUT = "0x2222222222222222222222222222222222222222";
      
      const intentData = createIntentData(
        TOKEN_IN,
        TOKEN_OUT,
        ethers.parseEther("10"),
        ethers.parseEther("9.5"),
        Math.floor(Date.now() / 1000) + 3600
      );
      const asyncNonce = 1;
      
      const tx1 = await encryptedSwap.connect(user1).submitSwapIntent(intentData, asyncNonce);
      const receipt1 = await tx1.wait();
      
      // Verify swap intent created
      expect(receipt1.logs.length).to.be.greaterThan(0);
      
      const intentId = ethers.solidityPackedKeccak256(
        ["address", "uint256", "bytes"],
        [user1.address, asyncNonce, intentData]
      );
      
      // Verify AsyncNonceEngine registered the transaction
      const asyncState = await asyncNonceEngine.getAsyncState(user1.address, asyncNonce);
      expect(asyncState.state).to.equal(0); // Pending

      // 2. Fisher bot executes the swap (after processing intent data off-chain)
      const swapVolume = ethers.parseEther("10");
      
      const tx2 = await encryptedSwap.connect(relayer).executeSwap(intentId, swapVolume);
      const receipt2 = await tx2.wait();
      
      // Verify swap executed
      const intent = await encryptedSwap.getSwapIntent(intentId);
      expect(intent.executed).to.be.true;
      
      // Verify aggregate metrics updated
      const metrics = await encryptedSwap.getAggregateMetrics();
      expect(metrics.volume).to.equal(swapVolume);
      expect(metrics.count).to.equal(1);
      
      // 3. Verify Fisher reward event was emitted
      const rewardEvents = receipt2.logs.filter(log => {
        try {
          const parsed = encryptedSwap.interface.parseLog(log);
          return parsed.name === "FisherRewardRecorded";
        } catch {
          return false;
        }
      });
      
      expect(rewardEvents.length).to.be.greaterThan(0);
    });

    it("Should handle multiple parallel swap intents", async function () {
      // Submit multiple intents with different async nonces
      const intents = [];
      for (let i = 1; i <= 5; i++) {
        const encryptedIntent = ethers.toUtf8Bytes(`encrypted_swap_${i}`);
        await encryptedSwap.connect(user1).submitSwapIntent(encryptedIntent, i);
        
        intents.push({
          id: ethers.solidityPackedKeccak256(
            ["address", "uint256", "bytes"],
            [user1.address, i, encryptedIntent]
          ),
          nonce: i
        });
      }
      
      // Execute all swaps
      const swapVolume = ethers.parseEther("5");
      for (const intent of intents) {
        await encryptedSwap.connect(relayer).executeSwap(intent.id, swapVolume);
      }
      
      // Verify all executed
      const metrics = await encryptedSwap.getAggregateMetrics();
      expect(metrics.count).to.equal(5);
      expect(metrics.volume).to.equal(swapVolume * 5n);
    });

    it("Should support batch swap execution", async function () {
      // Submit multiple intents
      const intentIds = [];
      const volumes = [];
      
      for (let i = 1; i <= 3; i++) {
        const encryptedIntent = ethers.toUtf8Bytes(`batch_swap_${i}`);
        await encryptedSwap.connect(user1).submitSwapIntent(encryptedIntent, i);
        
        intentIds.push(
          ethers.solidityPackedKeccak256(
            ["address", "uint256", "bytes"],
            [user1.address, i, encryptedIntent]
          )
        );
        volumes.push(ethers.parseEther(`${i * 10}`));
      }
      
      // Batch execute
      await encryptedSwap.connect(relayer).batchExecuteSwaps(intentIds, volumes);
      
      // Verify all executed
      const metrics = await encryptedSwap.getAggregateMetrics();
      expect(metrics.count).to.equal(3);
      
      const expectedVolume = volumes.reduce((sum, v) => sum + v, 0n);
      expect(metrics.volume).to.equal(expectedVolume);
    });
  });

  describe("Multi-User Parallel Execution", function () {
    it("Should handle concurrent swaps from multiple users", async function () {
      const users = [user1, user2, user3];
      const allIntents = [];
      
      // Each user submits multiple intents
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        for (let j = 1; j <= 3; j++) {
          const encryptedIntent = ethers.toUtf8Bytes(`user${i}_swap${j}`);
          await encryptedSwap.connect(user).submitSwapIntent(encryptedIntent, j);
          
          allIntents.push({
            id: ethers.solidityPackedKeccak256(
              ["address", "uint256", "bytes"],
              [user.address, j, encryptedIntent]
            ),
            user: user.address,
            nonce: j
          });
        }
      }
      
      // Execute all swaps
      const swapVolume = ethers.parseEther("3");
      for (const intent of allIntents) {
        await encryptedSwap.connect(relayer).executeSwap(intent.id, swapVolume);
      }
      
      // Verify total metrics
      const metrics = await encryptedSwap.getAggregateMetrics();
      expect(metrics.count).to.equal(9); // 3 users * 3 swaps
      expect(metrics.volume).to.equal(swapVolume * 9n);
    });

    it("Should handle independent async nonce states per user", async function () {
      // User1 creates nonces 1, 2, 3
      for (let i = 1; i <= 3; i++) {
        const intent = ethers.toUtf8Bytes(`user1_${i}`);
        await encryptedSwap.connect(user1).submitSwapIntent(intent, i);
      }
      
      // User2 creates nonces 1, 2, 3 (same numbers, different user)
      for (let i = 1; i <= 3; i++) {
        const intent = ethers.toUtf8Bytes(`user2_${i}`);
        await encryptedSwap.connect(user2).submitSwapIntent(intent, i);
      }
      
      // Settle user1's nonce 2
      await asyncNonceEngine.connect(user1).settleAsync(2);
      
      // User1's nonce 1 should be discarded, 2 settled, 3 pending
      const user1State1 = await asyncNonceEngine.getAsyncState(user1.address, 1);
      const user1State2 = await asyncNonceEngine.getAsyncState(user1.address, 2);
      const user1State3 = await asyncNonceEngine.getAsyncState(user1.address, 3);
      
      expect(user1State1.state).to.equal(2); // Discarded
      expect(user1State2.state).to.equal(1); // Settled
      expect(user1State3.state).to.equal(0); // Pending
      
      // User2's nonces should all still be pending
      const user2State1 = await asyncNonceEngine.getAsyncState(user2.address, 1);
      const user2State2 = await asyncNonceEngine.getAsyncState(user2.address, 2);
      
      expect(user2State1.state).to.equal(0); // Pending
      expect(user2State2.state).to.equal(0); // Pending
    });
  });

  describe("ShadowVault Integration", function () {
    it("Should create and manage encrypted positions independently", async function () {
      // Multiple users create positions in parallel
      const encryptedData1 = ethers.toUtf8Bytes("user1_position_data");
      const encryptedData2 = ethers.toUtf8Bytes("user2_position_data");
      const encryptedData3 = ethers.toUtf8Bytes("user3_position_data");
      
      await shadowVault.connect(user1).createPosition(encryptedData1);
      await shadowVault.connect(user2).createPosition(encryptedData2);
      await shadowVault.connect(user3).createPosition(encryptedData3);
      
      // Verify independent positions
      expect(await shadowVault.getPositionCount(user1.address)).to.equal(1);
      expect(await shadowVault.getPositionCount(user2.address)).to.equal(1);
      expect(await shadowVault.getPositionCount(user3.address)).to.equal(1);
      
      // Verify position isolation
      const pos1 = await shadowVault.getPosition(user1.address, 0);
      const pos2 = await shadowVault.getPosition(user2.address, 0);
      
      expect(pos1.encryptedData).to.not.equal(pos2.encryptedData);
    });

    it("Should support concurrent position operations", async function () {
      // User1 creates multiple positions
      for (let i = 0; i < 5; i++) {
        const data = ethers.toUtf8Bytes(`position_${i}`);
        await shadowVault.connect(user1).createPosition(data);
      }
      
      // Update position 2 while creating new ones
      const updatedData = ethers.toUtf8Bytes("updated_position_2");
      await shadowVault.connect(user1).updatePosition(2, updatedData);
      
      // Create more positions
      await shadowVault.connect(user1).createPosition(ethers.toUtf8Bytes("position_5"));
      
      // Verify state
      expect(await shadowVault.getPositionCount(user1.address)).to.equal(6);
      
      const pos2 = await shadowVault.getPosition(user1.address, 2);
      expect(pos2.encryptedData).to.equal(ethers.hexlify(updatedData));
    });
  });

  describe("PythAdapter Integration", function () {
    const tokenAddress = "0x0000000000000000000000000000000000000001";
    const pythPriceId = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";

    beforeEach(async function () {
      await pythAdapter.setPriceId(tokenAddress, pythPriceId);
      
      const block = await ethers.provider.getBlock('latest');
      await mockPyth.setPrice(pythPriceId, 3500 * 10**8, 10 * 10**8, -8, block.timestamp);
      await mockPyth.setUpdateFee(ethers.parseEther("0.01"));
    });

    it("Should update aggregate metrics with price feeds", async function () {
      const liquidity = ethers.parseEther("1000");
      const volume = ethers.parseEther("50");
      const updateFee = ethers.parseEther("0.01");
      
      await pythAdapter.updateAggregateMetrics(
        tokenAddress,
        liquidity,
        volume,
        [],
        { value: updateFee }
      );
      
      const metrics = await pythAdapter.getAggregateMetrics(tokenAddress);
      expect(metrics.totalLiquidity).to.equal(liquidity);
      expect(metrics.totalVolume).to.equal(volume);
      expect(metrics.lastPrice).to.equal(3500 * 10**8);
    });

    it("Should handle concurrent metric updates for different tokens", async function () {
      const token2 = "0x0000000000000000000000000000000000000002";
      const price2 = "0xaa61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace";
      
      await pythAdapter.setPriceId(token2, price2);
      
      const block = await ethers.provider.getBlock('latest');
      await mockPyth.setPrice(price2, 2000 * 10**8, 5 * 10**8, -8, block.timestamp);
      
      const updateFee = ethers.parseEther("0.01");
      
      // Update both tokens
      await pythAdapter.updateAggregateMetrics(
        tokenAddress,
        ethers.parseEther("1000"),
        ethers.parseEther("50"),
        [],
        { value: updateFee }
      );
      
      await pythAdapter.updateAggregateMetrics(
        token2,
        ethers.parseEther("2000"),
        ethers.parseEther("100"),
        [],
        { value: updateFee }
      );
      
      // Verify independent metrics
      const metrics1 = await pythAdapter.getAggregateMetrics(tokenAddress);
      const metrics2 = await pythAdapter.getAggregateMetrics(token2);
      
      expect(metrics1.totalLiquidity).to.equal(ethers.parseEther("1000"));
      expect(metrics2.totalLiquidity).to.equal(ethers.parseEther("2000"));
    });
  });

  describe("Complete System Integration", function () {
    it("Should demonstrate full Shadow Economy flow", async function () {
      // 1. User creates position in ShadowVault
      const positionData = ethers.toUtf8Bytes("encrypted_lending_position");
      await shadowVault.connect(user1).createPosition(positionData);
      
      // 2. User submits swap intent
      const swapIntent = ethers.toUtf8Bytes("encrypted_swap_intent");
      const asyncNonce = 1;
      await encryptedSwap.connect(user1).submitSwapIntent(swapIntent, asyncNonce);
      
      const intentId = ethers.solidityPackedKeccak256(
        ["address", "uint256", "bytes"],
        [user1.address, asyncNonce, swapIntent]
      );
      
      // 3. Fisher bot executes swap
      const volume = ethers.parseEther("25");
      await encryptedSwap.connect(relayer).executeSwap(intentId, volume);
      
      // 4. User updates position after swap
      const updatedPosition = ethers.toUtf8Bytes("updated_position_after_swap");
      await shadowVault.connect(user1).updatePosition(0, updatedPosition);
      
      // 5. Verify final state
      const position = await shadowVault.getPosition(user1.address, 0);
      expect(position.encryptedData).to.equal(ethers.hexlify(updatedPosition));
      
      const swapMetrics = await encryptedSwap.getAggregateMetrics();
      expect(swapMetrics.volume).to.equal(volume);
      expect(swapMetrics.count).to.equal(1);
      
      const intent = await encryptedSwap.getSwapIntent(intentId);
      expect(intent.executed).to.be.true;
    });

    it("Should handle high-throughput parallel scenario (Arcology simulation)", async function () {
      const users = [user1, user2, user3];
      const swapsPerUser = 10;
      
      // Simulate high-throughput parallel execution
      for (const user of users) {
        // Create vault position
        await shadowVault.connect(user).createPosition(
          ethers.toUtf8Bytes(`${user.address}_position`)
        );
        
        // Submit multiple parallel swap intents
        for (let i = 1; i <= swapsPerUser; i++) {
          const intent = ethers.toUtf8Bytes(`${user.address}_swap_${i}`);
          await encryptedSwap.connect(user).submitSwapIntent(intent, i);
        }
      }
      
      // Execute all swaps (in real Arcology, these would execute in parallel)
      let executedCount = 0;
      for (const user of users) {
        for (let i = 1; i <= swapsPerUser; i++) {
          const intent = ethers.toUtf8Bytes(`${user.address}_swap_${i}`);
          const intentId = ethers.solidityPackedKeccak256(
            ["address", "uint256", "bytes"],
            [user.address, i, intent]
          );
          
          await encryptedSwap.connect(relayer).executeSwap(
            intentId,
            ethers.parseEther("1")
          );
          executedCount++;
        }
      }
      
      // Verify final state
      const metrics = await encryptedSwap.getAggregateMetrics();
      expect(metrics.count).to.equal(executedCount);
      
      for (const user of users) {
        expect(await shadowVault.getPositionCount(user.address)).to.equal(1);
      }
    });
  });

  describe("Arcology Performance Patterns", function () {
    it("Should demonstrate low-conflict parallel execution pattern", async function () {
      // Pattern: Each user accesses their own storage slots
      // Expected: Zero conflicts on Arcology
      
      const users = [user1, user2, user3];
      
      // Parallel operations - each user independent
      for (const user of users) {
        await shadowVault.connect(user).createPosition(ethers.toUtf8Bytes("data"));
        await encryptedSwap.connect(user).submitSwapIntent(ethers.toUtf8Bytes("swap"), 1);
      }
      
      // Verify independent state
      for (const user of users) {
        expect(await shadowVault.getPositionCount(user.address)).to.equal(1);
      }
    });

    it("Should demonstrate atomic counter efficiency", async function () {
      // AtomicCounters minimize conflicts for aggregate metrics
      const numSwaps = 20;
      
      for (let i = 1; i <= numSwaps; i++) {
        const intent = ethers.toUtf8Bytes(`swap_${i}`);
        await encryptedSwap.connect(user1).submitSwapIntent(intent, i);
        
        const intentId = ethers.solidityPackedKeccak256(
          ["address", "uint256", "bytes"],
          [user1.address, i, intent]
        );
        
        await encryptedSwap.connect(relayer).executeSwap(
          intentId,
          ethers.parseEther("1")
        );
      }
      
      // Verify AtomicCounter tracked all operations
      const metrics = await encryptedSwap.getAggregateMetrics();
      expect(metrics.count).to.equal(numSwaps);
    });
  });
});


