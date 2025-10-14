const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy AsyncNonceEngine
  const asyncNonceEngine = await hre.ethers.deployContract("AsyncNonceEngine");
  await asyncNonceEngine.waitForDeployment();
  const engineAddress = await asyncNonceEngine.getAddress();
  console.log(`AsyncNonceEngine deployed to: ${engineAddress}`);

  // Deploy ShadowVault
  const shadowVault = await hre.ethers.deployContract("ShadowVault");
  await shadowVault.waitForDeployment();
  const vaultAddress = await shadowVault.getAddress();
  console.log(`ShadowVault deployed to: ${vaultAddress}`);

  // Deploy MockPyth (for local testing)
  const mockPyth = await hre.ethers.deployContract("MockPyth");
  await mockPyth.waitForDeployment();
  const mockPythAddress = await mockPyth.getAddress();
  console.log(`MockPyth deployed to: ${mockPythAddress}`);
  
  // Deploy PythAdapter with MockPyth address
  const pythAdapter = await hre.ethers.deployContract("PythAdapter", [mockPythAddress]);
  await pythAdapter.waitForDeployment();
  const adapterAddress = await pythAdapter.getAddress();
  console.log(`PythAdapter deployed to: ${adapterAddress}`);

  // Deploy EncryptedSwap with AsyncNonceEngine address
  const encryptedSwap = await hre.ethers.deployContract("EncryptedSwap", [engineAddress]);
  await encryptedSwap.waitForDeployment();
  const swapAddress = await encryptedSwap.getAddress();
  console.log(`EncryptedSwap deployed to: ${swapAddress}`);

  // Authorize the EncryptedSwap contract to use the AsyncNonceEngine
  console.log("Authorizing EncryptedSwap contract on AsyncNonceEngine...");
  const tx = await asyncNonceEngine.setAuthorizedContract(swapAddress, true);
  await tx.wait();
  console.log("Authorization complete.");

  console.log("\n--- Deployment Summary ---");
  console.log(`ASYNC_NONCE_ENGINE_ADDRESS=${engineAddress}`);
  console.log(`SHADOW_VAULT_ADDRESS=${vaultAddress}`);
  console.log(`PYTH_ADAPTER_ADDRESS=${adapterAddress}`);
  console.log(`ENCRYPTED_SWAP_ADDRESS=${swapAddress}`);
  console.log("\nCopy the addresses above into your bots/.env file.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});