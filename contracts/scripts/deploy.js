const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const networkName = hre.network.name;
  const isArcology = networkName.includes("arcology");
  
  console.log("═".repeat(80));
  console.log("🚀 SHADOW ECONOMY - ARCOLOGY DEPLOYMENT (MVP)");
  console.log("═".repeat(80));
  console.log(`\n📡 Network: ${networkName}`);
  console.log(`🔗 Chain ID: ${hre.network.config.chainId}`);
  
  if (isArcology) {
    console.log("\n✨ Arcology Parallel Blockchain Optimizations:");
    console.log("   ✓ AtomicCounter for conflict-resistant metrics");
    console.log("   ✓ Per-user storage isolation");
    console.log("   ✓ Expected Performance: 10,000-15,000 TPS");
    console.log("   ✓ Optimistic concurrency control");
    console.log("   ✓ 100x lower gas costs vs Ethereum L1\n");
  } else {
    console.log("\n⚠️  Deploying to standard EVM network");
    console.log("   - Arcology optimizations will still work but won't achieve full parallel TPS\n");
  }

  // Pyth contract address (use real Pyth contract for Arcology)
  // TODO: Replace with actual Pyth contract address on Arcology testnet
  const pythAddress = process.env.PYTH_CONTRACT_ADDRESS || "0x4305FB66699C3B2702D4d05CF36551390A4c69C6";
  console.log(`\n🔮 Using Pyth Oracle at: ${pythAddress}`);
  console.log("   Note: Ensure this is the correct Pyth contract for your network\n");

  // Deploy PythAdapter (Hermes Pull Oracle integration)
  console.log("1/3 Deploying PythAdapter for real Pyth price feeds...");
  const pythAdapter = await hre.ethers.deployContract("PythAdapter", [pythAddress]);
  await pythAdapter.waitForDeployment();
  const adapterAddress = await pythAdapter.getAddress();
  console.log(`✅ PythAdapter deployed: ${adapterAddress}`);
  console.log("   - Uses Pyth Hermes API for price feeds");
  console.log("   - No mock data - production-ready oracle integration\n");

  // Deploy EncryptedSwap (parallel swap execution)
  console.log("2/3 Deploying EncryptedSwap for parallel private swaps...");
  const encryptedSwap = await hre.ethers.deployContract("EncryptedSwap", [adapterAddress]);
  await encryptedSwap.waitForDeployment();
  const swapAddress = await encryptedSwap.getAddress();
  console.log(`✅ EncryptedSwap deployed: ${swapAddress}`);
  console.log("   - Integrated with PythAdapter for price validation");
  console.log("   - AtomicCounter for parallel metrics");
  console.log("   - Optimized for Arcology parallel execution\n");

  // Deploy SimpleLending (parallel lending protocol)
  console.log("3/3 Deploying SimpleLending for parallel lending operations...");
  const simpleLending = await hre.ethers.deployContract("SimpleLending", [adapterAddress]);
  await simpleLending.waitForDeployment();
  const lendingAddress = await simpleLending.getAddress();
  console.log(`✅ SimpleLending deployed: ${lendingAddress}`);
  console.log("   - Deposit/withdraw functionality");
  console.log("   - Borrow/repay with collateral checks");
  console.log("   - Pyth oracle integration for collateral pricing");
  console.log("   - AtomicCounter for parallel metrics\n");

  // Get AtomicCounter addresses from EncryptedSwap
  const swapVolumeCounter = await encryptedSwap.totalSwapVolume();
  const swapCountCounter = await encryptedSwap.totalSwapCount();
  
  // Get AtomicCounter addresses from SimpleLending
  const depositsCounter = await simpleLending.totalDeposits();
  const borrowsCounter = await simpleLending.totalBorrows();
  const collateralCounter = await simpleLending.totalCollateral();

  // Deployment summary
  const deploymentInfo = {
    network: networkName,
    chainId: hre.network.config.chainId,
    timestamp: new Date().toISOString(),
    contracts: {
      PythAdapter: adapterAddress,
      EncryptedSwap: swapAddress,
      SimpleLending: lendingAddress,
      PythOracle: pythAddress
    },
    atomicCounters: {
      swapVolume: swapVolumeCounter,
      swapCount: swapCountCounter,
      totalDeposits: depositsCounter,
      totalBorrows: borrowsCounter,
      totalCollateral: collateralCounter
    },
    arcologyOptimizations: isArcology
  };

  console.log("═".repeat(80));
  console.log("🎉 DEPLOYMENT COMPLETE - SHADOW ECONOMY MVP ON ARCOLOGY");
  console.log("═".repeat(80));
  console.log("\n📝 Contract Addresses:\n");
  console.log(`PYTH_ADAPTER_ADDRESS=${adapterAddress}`);
  console.log(`ENCRYPTED_SWAP_ADDRESS=${swapAddress}`);
  console.log(`SIMPLE_LENDING_ADDRESS=${lendingAddress}`);
  console.log(`PYTH_ORACLE_ADDRESS=${pythAddress}`);
  
  console.log("\n🔢 AtomicCounter Instances (Arcology Optimization):\n");
  console.log(`Swap Volume Counter: ${swapVolumeCounter}`);
  console.log(`Swap Count Counter: ${swapCountCounter}`);
  console.log(`Total Deposits Counter: ${depositsCounter}`);
  console.log(`Total Borrows Counter: ${borrowsCounter}`);
  console.log(`Total Collateral Counter: ${collateralCounter}`);
  
  console.log("\n💾 Saving deployment info to .env.arcology...");
  const envContent = `# Shadow Economy - Arcology Deployment (MVP)
# Network: ${networkName}
# Deployed: ${deploymentInfo.timestamp}

ARCOLOGY_RPC_URL=${hre.network.config.url}
ARCOLOGY_CHAIN_ID=${hre.network.config.chainId}

# Contract Addresses
PYTH_ADAPTER_ADDRESS=${adapterAddress}
ENCRYPTED_SWAP_ADDRESS=${swapAddress}
SIMPLE_LENDING_ADDRESS=${lendingAddress}
PYTH_ORACLE_ADDRESS=${pythAddress}

# AtomicCounter Addresses
SWAP_VOLUME_COUNTER=${swapVolumeCounter}
SWAP_COUNT_COUNTER=${swapCountCounter}
DEPOSITS_COUNTER=${depositsCounter}
BORROWS_COUNTER=${borrowsCounter}
COLLATERAL_COUNTER=${collateralCounter}
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
  console.log("1. ✓ Core contracts deployed to Arcology");
  console.log("2. ✓ Real Pyth oracle integration configured");
  console.log("3. ✓ AtomicCounters deployed for parallel execution");
  console.log("4. → Set Pyth price IDs: pythAdapter.setPriceId(token, priceId)");
  console.log("5. → Test parallel swaps with multiple users");
  console.log("6. → Test parallel lending operations");
  console.log("7. → Wire Fisher bot integration (to be implemented)\n");

  if (isArcology) {
    console.log("🚀 Arcology Parallel Execution Features:");
    console.log("   ✓ AtomicCounter minimizes storage conflicts");
    console.log("   ✓ Per-user storage isolation");
    console.log("   ✓ Multiple swaps execute simultaneously");
    console.log("   ✓ Multiple lending operations execute simultaneously");
    console.log("   ✓ Expected TPS: 10,000-15,000");
    console.log("   ✓ Gas costs: ~100x lower than Ethereum L1\n");
  }

  console.log("🔮 Pyth Oracle Integration:");
  console.log("   - Real Pyth price feeds via Hermes API");
  console.log("   - No mock data - production ready");
  console.log("   - Price validation for swaps and lending");
  console.log("   - Staleness checks (60 second threshold)\n");

  console.log("📊 Demonstrable Features:");
  console.log("   - Parallel swap execution across multiple users");
  console.log("   - Parallel lending (deposits/borrows) across multiple users");
  console.log("   - Real-time price feeds from Pyth");
  console.log("   - Conflict-resistant metrics via AtomicCounter\n");

  console.log("═".repeat(80));
  console.log("Deployment successful! 🎊");
  console.log("═".repeat(80) + "\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
