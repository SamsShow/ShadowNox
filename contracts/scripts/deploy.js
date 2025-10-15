const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Shadow Economy contracts to Arcology Parallel Blockchain...\n");
  console.log("📊 Expected Arcology Performance:");
  console.log("   - Throughput: 10,000-15,000 TPS");
  console.log("   - Execution: Parallel with optimistic concurrency");
  console.log("   - Gas Costs: 100x lower than Ethereum L1\n");

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

  // Authorize the EncryptedSwap contract to use the AsyncNonceEngine
  console.log("\nAuthorizing EncryptedSwap contract on AsyncNonceEngine...");
  const tx = await asyncNonceEngine.setAuthorizedContract(swapAddress, true);
  await tx.wait();
  console.log("✅ Authorization complete.\n");

  console.log("=" .repeat(70));
  console.log("🎉 Deployment to Arcology Parallel Blockchain Complete!");
  console.log("=" .repeat(70));
  console.log("\n📝 Contract Addresses (copy to bots/.env):\n");
  console.log(`ASYNC_NONCE_ENGINE_ADDRESS=${engineAddress}`);
  console.log(`SHADOW_VAULT_ADDRESS=${vaultAddress}`);
  console.log(`PYTH_ADAPTER_ADDRESS=${adapterAddress}`);
  console.log(`ENCRYPTED_SWAP_ADDRESS=${swapAddress}`);
  console.log("\n📚 Next Steps:");
  console.log("1. Copy contract addresses to bots/.env");
  console.log("2. Configure EVVM Fisher bots for transaction relay");
  console.log("3. Set up Lit Protocol for metadata encryption (IPFS/Arweave)");
  console.log("4. Configure Pyth Hermes API for pull oracle integration");
  console.log("5. Start EVVM Fisher bots: cd bots && npm start");
  console.log("\n🚀 Arcology Features:");
  console.log("   - Parallel execution at 10k-15k TPS");
  console.log("   - Optimistic concurrency control");
  console.log("   - 100x lower gas costs");
  console.log("   - Future: Concurrent Library for advanced parallel contracts\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});