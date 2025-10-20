const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const networkName = hre.network.name;
  const isArcology = networkName.includes("arcology");
  
  console.log("═".repeat(80));
  console.log("🚀 SHADOW ECONOMY - ARCOLOGY DEPLOYMENT");
  console.log("═".repeat(80));
  console.log(`\n📡 Network: ${networkName}`);
  console.log(`🔗 Chain ID: ${hre.network.config.chainId}`);
  
  if (isArcology) {
    console.log("\n✨ Arcology Parallel Blockchain Optimizations Enabled:");
    console.log("   ✓ AtomicCounter for conflict-resistant metrics");
    console.log("   ✓ Per-user storage isolation");
    console.log("   ✓ Batch execution support");
    console.log("   ✓ Expected Performance: 10,000-15,000 TPS");
    console.log("   ✓ Optimistic concurrency control");
    console.log("   ✓ 100x lower gas costs vs Ethereum L1\n");
  } else {
    console.log("\n⚠️  Deploying to standard EVM network");
    console.log("   - Arcology optimizations will still work but won't achieve full parallel TPS\n");
  }

  // Deploy AsyncNonceEngine (Arcology async nonce support)
  console.log("Deploying AsyncNonceEngine for parallel transaction execution...");
  const asyncNonceEngine = await hre.ethers.deployContract("AsyncNonceEngine");
  await asyncNonceEngine.waitForDeployment();
  const engineAddress = await asyncNonceEngine.getAddress();
  console.log(`✅ AsyncNonceEngine deployed to Arcology: ${engineAddress}`);

  // Deploy ShadowVault (encrypted position storage)
  console.log("Deploying ShadowVault for encrypted position metadata...");
  const shadowVault = await hre.ethers.deployContract("ShadowVault");
  await shadowVault.waitForDeployment();
  const vaultAddress = await shadowVault.getAddress();
  console.log(`✅ ShadowVault deployed to Arcology: ${vaultAddress}`);
  console.log("   Note: Encrypted data stored off-chain (IPFS/Arweave)\n");

  // Deploy MockPyth (for local Arcology DevNet testing)
  console.log("Deploying MockPyth for local oracle testing...");
  const mockPyth = await hre.ethers.deployContract("MockPyth");
  await mockPyth.waitForDeployment();
  const mockPythAddress = await mockPyth.getAddress();
  console.log(`✅ MockPyth deployed to Arcology: ${mockPythAddress}`);
  
  // Deploy PythAdapter (Hermes Pull Oracle integration)
  console.log("Deploying PythAdapter for Pyth Hermes integration...");
  const pythAdapter = await hre.ethers.deployContract("PythAdapter", [mockPythAddress]);
  await pythAdapter.waitForDeployment();
  const adapterAddress = await pythAdapter.getAddress();
  console.log(`✅ PythAdapter deployed to Arcology: ${adapterAddress}`);
  console.log("   Note: Use Hermes API for price feeds in production\n");

  // Deploy EncryptedSwap (parallel swap execution)
  console.log("Deploying EncryptedSwap for parallel private swaps...");
  const encryptedSwap = await hre.ethers.deployContract("EncryptedSwap", [engineAddress]);
  await encryptedSwap.waitForDeployment();
  const swapAddress = await encryptedSwap.getAddress();
  console.log(`✅ EncryptedSwap deployed to Arcology: ${swapAddress}`);

  // Deploy FisherRewards (bot incentive system)
  console.log("Deploying FisherRewards for bot incentive system...");
  const fisherRewards = await hre.ethers.deployContract("FisherRewards");
  await fisherRewards.waitForDeployment();
  const rewardsAddress = await fisherRewards.getAddress();
  console.log(`✅ FisherRewards deployed to Arcology: ${rewardsAddress}`);
  console.log("   Note: Fund reward pool with: fisherRewards.fundRewardPool()\n");
  
  // Fund FisherRewards pool if specified
  const rewardPoolAmount = process.env.FISHER_REWARD_POOL_AMOUNT || hre.ethers.parseEther("10");
  console.log(`Funding FisherRewards pool with ${hre.ethers.formatEther(rewardPoolAmount)} ETH...`);
  const fundTx = await fisherRewards.fundRewardPool({ value: rewardPoolAmount });
  await fundTx.wait();
  console.log("✅ Reward pool funded\n");

  // Authorize the EncryptedSwap contract to use the AsyncNonceEngine
  console.log("Authorizing EncryptedSwap contract on AsyncNonceEngine...");
  const authTx = await asyncNonceEngine.setAuthorizedContract(swapAddress, true);
  await authTx.wait();
  console.log("✅ Authorization complete.\n");

  // Link FisherRewards to EncryptedSwap
  console.log("Linking FisherRewards to EncryptedSwap...");
  const linkTx = await encryptedSwap.setFisherRewards(rewardsAddress);
  await linkTx.wait();
  console.log("✅ FisherRewards linked\n");

  // Deployment summary
  const deploymentInfo = {
    network: networkName,
    chainId: hre.network.config.chainId,
    timestamp: new Date().toISOString(),
    contracts: {
      AsyncNonceEngine: engineAddress,
      ShadowVault: vaultAddress,
      MockPyth: mockPythAddress,
      PythAdapter: adapterAddress,
      EncryptedSwap: swapAddress,
      FisherRewards: rewardsAddress
    },
    arcologyOptimizations: isArcology,
    rewardPoolFunded: hre.ethers.formatEther(rewardPoolAmount) + " ETH"
  };

  console.log("═".repeat(80));
  console.log("🎉 DEPLOYMENT COMPLETE - SHADOW ECONOMY ON ARCOLOGY");
  console.log("═".repeat(80));
  console.log("\n📝 Contract Addresses:\n");
  console.log(`ASYNC_NONCE_ENGINE_ADDRESS=${engineAddress}`);
  console.log(`SHADOW_VAULT_ADDRESS=${vaultAddress}`);
  console.log(`PYTH_ADAPTER_ADDRESS=${adapterAddress}`);
  console.log(`ENCRYPTED_SWAP_ADDRESS=${swapAddress}`);
  console.log(`FISHER_REWARDS_ADDRESS=${rewardsAddress}`);
  console.log(`MOCK_PYTH_ADDRESS=${mockPythAddress}`);
  
  console.log("\n💾 Saving deployment info to .env.arcology...");
  const envContent = `# Shadow Economy - Arcology Deployment
# Network: ${networkName}
# Deployed: ${deploymentInfo.timestamp}

ARCOLOGY_RPC_URL=${hre.network.config.url}
ARCOLOGY_CHAIN_ID=${hre.network.config.chainId}

# Contract Addresses
ASYNC_NONCE_ENGINE_ADDRESS=${engineAddress}
SHADOW_VAULT_ADDRESS=${vaultAddress}
PYTH_ADAPTER_ADDRESS=${adapterAddress}
ENCRYPTED_SWAP_ADDRESS=${swapAddress}
FISHER_REWARDS_ADDRESS=${rewardsAddress}
MOCK_PYTH_ADDRESS=${mockPythAddress}

# Fisher Rewards Configuration
FISHER_REWARD_POOL_BALANCE=${hre.ethers.formatEther(rewardPoolAmount)}
`;

  fs.writeFileSync(
    path.join(__dirname, "../.env.arcology"),
    envContent,
    "utf8"
  );
  console.log("✅ Saved to contracts/.env.arcology\n");

  // Save JSON deployment info
  fs.writeFileSync(
    path.join(__dirname, "../deployments.json"),
    JSON.stringify(deploymentInfo, null, 2),
    "utf8"
  );
  console.log("✅ Saved deployment info to contracts/deployments.json\n");

  console.log("📚 Next Steps:\n");
  console.log("1. ✓ Contracts deployed to Arcology");
  console.log("2. ✓ FisherRewards pool funded");
  console.log("3. ✓ Contract authorizations configured");
  console.log("4. → Copy addresses to bots/.env for Fisher bot integration");
  console.log("5. → Configure Lit Protocol for metadata encryption");
  console.log("6. → Set up Pyth Hermes API integration");
  console.log("7. → Register Fisher bots: fisherRewards.registerFisher()");
  console.log("8. → Start accepting encrypted swap intents\n");

  if (isArcology) {
    console.log("🚀 Arcology Parallel Execution Features:");
    console.log("   ✓ AtomicCounter minimizes storage conflicts");
    console.log("   ✓ Batch execution: batchExecuteSwaps()");
    console.log("   ✓ Batch settlement: batchSettleAsync()");
    console.log("   ✓ Per-user storage isolation");
    console.log("   ✓ Expected TPS: 10,000-15,000");
    console.log("   ✓ Gas costs: ~100x lower than Ethereum L1\n");
  }

  console.log("🤖 Fisher Bot Integration Points:");
  console.log("   - submitSwapIntent(): User submits encrypted intent");
  console.log("   - executeSwap(): Fisher executes after Lit decryption");
  console.log("   - claimRewards(): Fisher claims accumulated rewards");
  console.log("   - Events: SwapIntentSubmitted, FisherRewardRecorded\n");

  console.log("═".repeat(80));
  console.log("Deployment successful! 🎊");
  console.log("═".repeat(80) + "\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});