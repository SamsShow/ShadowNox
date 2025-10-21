const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * ShadowVault Tests
 * 
 * Position Data Format (ABI-encoded):
 * - asset (address): Position asset address (token/LP token)
 * - amount (uint256): Position amount
 * - entryPrice (uint256): Entry price (for P&L calculation)
 * - timestamp (uint256): Position creation timestamp
 * 
 * Example:
 * const positionData = ethers.AbiCoder.defaultAbiCoder().encode(
 *   ["address", "uint256", "uint256", "uint256"],
 *   [asset, amount, entryPrice, timestamp]
 * );
 */

describe("ShadowVault", function () {
  let vault;
  let owner;
  let addr1;
  let MOCK_ASSET; // Mock asset address

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    // Mock asset address for testing
    MOCK_ASSET = "0x3333333333333333333333333333333333333333";
    
    const ShadowVaultFactory = await ethers.getContractFactory("ShadowVault");
    vault = await ShadowVaultFactory.deploy();
    await vault.waitForDeployment();
  });

  // Helper function to create ABI-encoded position data
  function createPositionData(asset, amount, entryPrice, timestamp) {
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "uint256", "uint256"],
      [asset, amount, entryPrice, timestamp]
    );
  }

  describe("Position Management", function () {
    it("Should create a new position with ABI-encoded data and emit an event", async function () {
      const positionData = createPositionData(
        MOCK_ASSET,
        ethers.parseEther("100"),
        ethers.parseEther("1.5"),
        Math.floor(Date.now() / 1000)
      );

      await expect(vault.createPosition(positionData))
        .to.emit(vault, "PositionCreated")
        .withArgs(owner.address, 0, (await ethers.provider.getBlock('latest')).timestamp + 1);
      
      const positionCount = await vault.getPositionCount(owner.address);
      expect(positionCount).to.equal(1);
    });

    it("Should allow a user to have multiple positions with ABI-encoded data", async function () {
      const positionData1 = createPositionData(
        MOCK_ASSET,
        ethers.parseEther("100"),
        ethers.parseEther("1.5"),
        Math.floor(Date.now() / 1000)
      );
      
      const positionData2 = createPositionData(
        MOCK_ASSET,
        ethers.parseEther("200"),
        ethers.parseEther("2.0"),
        Math.floor(Date.now() / 1000)
      );

      await vault.createPosition(positionData1);
      await vault.createPosition(positionData2);

      const positionCount = await vault.getPositionCount(owner.address);
      expect(positionCount).to.equal(2);
    });

    it("Should retrieve a specific position with ABI-encoded data", async function () {
      const positionData = createPositionData(
        MOCK_ASSET,
        ethers.parseEther("50"),
        ethers.parseEther("1.0"),
        Math.floor(Date.now() / 1000)
      );
      
      await vault.createPosition(positionData);

      const position = await vault.getPosition(owner.address, 0);
      expect(position.positionData).to.equal(positionData);
      expect(position.active).to.be.true;
    });
    
    it("Should update an existing position with ABI-encoded data", async function () {
        const initialData = createPositionData(
          MOCK_ASSET,
          ethers.parseEther("100"),
          ethers.parseEther("1.5"),
          Math.floor(Date.now() / 1000)
        );
        
        await vault.createPosition(initialData);
        
        const updatedData = createPositionData(
          MOCK_ASSET,
          ethers.parseEther("150"),
          ethers.parseEther("1.6"),
          Math.floor(Date.now() / 1000)
        );
        
        await expect(vault.updatePosition(0, updatedData))
            .to.emit(vault, "PositionUpdated");

        const position = await vault.getPosition(owner.address, 0);
        expect(position.positionData).to.equal(updatedData);
    });

    it("Should close an active position", async function () {
        const positionData = createPositionData(
          MOCK_ASSET,
          ethers.parseEther("100"),
          ethers.parseEther("1.5"),
          Math.floor(Date.now() / 1000)
        );
        
        await vault.createPosition(positionData);

        await expect(vault.closePosition(0))
            .to.emit(vault, "PositionClosed");
            
        const position = await vault.getPosition(owner.address, 0);
        expect(position.active).to.be.false;
    });
  });

  describe("Error Handling and Security", function () {
    it("Should revert when trying to get a non-existent position", async function () {
      await expect(vault.getPosition(owner.address, 0))
        .to.be.revertedWithCustomError(vault, "PositionNotFound");
    });
    
    it("Should revert when trying to update a non-existent position", async function () {
        const updatedData = createPositionData(
          MOCK_ASSET,
          ethers.parseEther("100"),
          ethers.parseEther("1.5"),
          Math.floor(Date.now() / 1000)
        );
        
        await expect(vault.updatePosition(0, updatedData))
            .to.be.revertedWithCustomError(vault, "PositionNotFound");
    });

    it("Should isolate positions between different users with ABI-encoded data", async function() {
        const positionDataOwner = createPositionData(
          MOCK_ASSET,
          ethers.parseEther("100"),
          ethers.parseEther("1.5"),
          Math.floor(Date.now() / 1000)
        );
        
        await vault.connect(owner).createPosition(positionDataOwner);

        const positionDataAddr1 = createPositionData(
          MOCK_ASSET,
          ethers.parseEther("200"),
          ethers.parseEther("2.0"),
          Math.floor(Date.now() / 1000)
        );
        
        await vault.connect(addr1).createPosition(positionDataAddr1);

        const ownerPos = await vault.getPosition(owner.address, 0);
        const addr1Pos = await vault.getPosition(addr1.address, 0);
        
        // Positions should be different (different encoded data)
        expect(ownerPos.positionData).to.not.equal(addr1Pos.positionData);
    });
    
    it("Should revert when trying to close a position that is already inactive", async function() {
        const positionData = createPositionData(
          MOCK_ASSET,
          ethers.parseEther("100"),
          ethers.parseEther("1.5"),
          Math.floor(Date.now() / 1000)
        );
        
        await vault.createPosition(positionData);
        await vault.closePosition(0); 
        
        await expect(vault.closePosition(0)) 
            .to.be.revertedWithCustomError(vault, "PositionNotActive");
    });
  });
});