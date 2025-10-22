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

  console.log("\n🔮 Oracle Solution: Custom Price Oracle");
  console.log("   ⚠️  NOTE: Pyth Network is NOT deployed on Arcology");
  console.log("   ✓ Using CustomPriceOracle instead");
  console.log("   ✓ Fetches real prices from Pyth Hermes API (off-chain)");
  console.log("   ✓ Stores prices on-chain via Fisher bot updates");
  console.log("   ✓ No dependency on Pyth on-chain contracts\n");

  // Deploy CustomPriceOracle (Pyth Hermes API integration without on-chain dependency)
  console.log("1/3 Deploying CustomPriceOracle for real price feeds...");
  const priceOracle = await hre.ethers.deployContract("CustomPriceOracle");
  await priceOracle.waitForDeployment();
  const oracleAddress = await priceOracle.getAddress();
  console.log(`✅ CustomPriceOracle deployed: ${oracleAddress}`);
  console.log("   - Fetches from Pyth Hermes API (https://hermes.pyth.network)");
  console.log("   - Fisher bots update prices on-chain");
  console.log("   - No mock data - production-ready oracle integration\n");

  // Deploy EncryptedSwap (parallel swap execution)
  console.log("2/3 Deploying EncryptedSwap for parallel private swaps...");
  const encryptedSwap = await hre.ethers.deployContract("EncryptedSwap", [oracleAddress]);
  await encryptedSwap.waitForDeployment();
  const swapAddress = await encryptedSwap.getAddress();
  console.log(`✅ EncryptedSwap deployed: ${swapAddress}`);
  console.log("   - Integrated with CustomPriceOracle for price validation");
  console.log("   - AtomicCounter for parallel metrics");
  console.log("   - Optimized for Arcology parallel execution\n");

  // Deploy SimpleLending (parallel lending protocol)
  console.log("3/3 Deploying SimpleLending for parallel lending operations...");
  const simpleLending = await hre.ethers.deployContract("SimpleLending", [oracleAddress]);
  await simpleLending.waitForDeployment();
  const lendingAddress = await simpleLending.getAddress();
  console.log(`✅ SimpleLending deployed: ${lendingAddress}`);
  console.log("   - Deposit/withdraw functionality");
  console.log("   - Borrow/repay with collateral checks");
  console.log("   - CustomPriceOracle integration for collateral pricing");
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
      CustomPriceOracle: oracleAddress,
      EncryptedSwap: swapAddress,
      SimpleLending: lendingAddress
    },
    atomicCounters: {
      swapVolume: swapVolumeCounter,
      swapCount: swapCountCounter,
      totalDeposits: depositsCounter,
      totalBorrows: borrowsCounter,
      totalCollateral: collateralCounter
    },
    arcologyOptimizations: isArcology,
    oracleNotes: "Uses Pyth Hermes API off-chain (no Pyth on-chain contract required)"
  };

  console.log("═".repeat(80));
  console.log("🎉 DEPLOYMENT COMPLETE - SHADOW ECONOMY MVP ON ARCOLOGY");
  console.log("═".repeat(80));
  console.log("\n📝 Contract Addresses:\n");
  console.log(`CUSTOM_PRICE_ORACLE_ADDRESS=${oracleAddress}`);
  console.log(`ENCRYPTED_SWAP_ADDRESS=${swapAddress}`);
  console.log(`SIMPLE_LENDING_ADDRESS=${lendingAddress}`);
  
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

# Oracle Configuration
# NOTE: Pyth Network is NOT deployed on Arcology
# Using CustomPriceOracle with Pyth Hermes API (off-chain)
PYTH_HERMES_URL=https://hermes.pyth.network

# Contract Addresses
CUSTOM_PRICE_ORACLE_ADDRESS=${oracleAddress}
ENCRYPTED_SWAP_ADDRESS=${swapAddress}
SIMPLE_LENDING_ADDRESS=${lendingAddress}

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
  console.log("2. ✓ CustomPriceOracle deployed (Pyth Hermes API integration)");
  console.log("3. ✓ AtomicCounters deployed for parallel execution");
  console.log("4. → Set price IDs: oracle.setPriceId(tokenAddress, pythPriceId)");
  console.log("5. → Authorize Fisher bots: oracle.setAuthorizedUpdater(botAddress, true)");
  console.log("6. → Start Fisher bot price updates from Hermes API");
  console.log("7. → Test parallel swaps with multiple users");
  console.log("8. → Test parallel lending operations\n");

  if (isArcology) {
    console.log("🚀 Arcology Parallel Execution Features:");
    console.log("   ✓ AtomicCounter minimizes storage conflicts");
    console.log("   ✓ Per-user storage isolation");
    console.log("   ✓ Multiple swaps execute simultaneously");
    console.log("   ✓ Multiple lending operations execute simultaneously");
    console.log("   ✓ Expected TPS: 10,000-15,000");
    console.log("   ✓ Gas costs: ~100x lower than Ethereum L1\n");
  }

  console.log("🔮 Custom Oracle Integration (Pyth Hermes API):");
  console.log("   - ⚠️  Pyth Network NOT available on Arcology");
  console.log("   - ✓ Solution: CustomPriceOracle with off-chain Hermes API");
  console.log("   - ✓ Fisher bots fetch from https://hermes.pyth.network");
  console.log("   - ✓ Real price data, no mock feeds");
  console.log("   - ✓ Price validation for swaps and lending");
  console.log("   - ✓ Staleness checks (60 second threshold)\n");

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
