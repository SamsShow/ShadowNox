const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShadowVault", function () {
  let vault;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const ShadowVaultFactory = await ethers.getContractFactory("ShadowVault");
    vault = await ShadowVaultFactory.deploy();
    await vault.waitForDeployment();
  });

  describe("Position Management", function () {
    it("Should create a new position and emit an event", async function () {
      const encryptedData = ethers.toUtf8Bytes("encrypted_lending_position_data");

      await expect(vault.createPosition(encryptedData))
        .to.emit(vault, "PositionCreated")
        .withArgs(owner.address, 0, (await ethers.provider.getBlock('latest')).timestamp + 1);
      
      const positionCount = await vault.getPositionCount(owner.address);
      expect(positionCount).to.equal(1);
    });

    it("Should allow a user to have multiple positions", async function () {
      const encryptedData1 = ethers.toUtf8Bytes("position1");
      const encryptedData2 = ethers.toUtf8Bytes("position2");

      await vault.createPosition(encryptedData1);
      await vault.createPosition(encryptedData2);

      const positionCount = await vault.getPositionCount(owner.address);
      expect(positionCount).to.equal(2);
    });

    it("Should retrieve a specific position", async function () {
      const encryptedData = ethers.toUtf8Bytes("my_encrypted_data");
      await vault.createPosition(encryptedData);

      const position = await vault.getPosition(owner.address, 0);
      expect(position.encryptedData).to.equal(ethers.hexlify(encryptedData));
      expect(position.active).to.be.true;
    });
    
    it("Should update an existing position", async function () {
        const initialData = ethers.toUtf8Bytes("initial_data");
        await vault.createPosition(initialData);
        
        const updatedData = ethers.toUtf8Bytes("updated_data");
        await expect(vault.updatePosition(0, updatedData))
            .to.emit(vault, "PositionUpdated");

        const position = await vault.getPosition(owner.address, 0);
        expect(position.encryptedData).to.equal(ethers.hexlify(updatedData));
    });

    it("Should close an active position", async function () {
        const encryptedData = ethers.toUtf8Bytes("active_position");
        await vault.createPosition(encryptedData);

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
        const updatedData = ethers.toUtf8Bytes("updated_data");
        await expect(vault.updatePosition(0, updatedData))
            .to.be.revertedWithCustomError(vault, "PositionNotFound");
    });

    it("Should prevent a user from accessing another user's position details directly (though data is encrypted)", async function() {
        const encryptedDataOwner = ethers.toUtf8Bytes("owner_data");
        await vault.connect(owner).createPosition(encryptedDataOwner);

        const encryptedDataAddr1 = ethers.toUtf8Bytes("addr1_data");
        await vault.connect(addr1).createPosition(encryptedDataAddr1);

        const ownerPos = await vault.getPosition(owner.address, 0);
        const addr1Pos = await vault.getPosition(addr1.address, 0);
        
        expect(ownerPos.encryptedData).to.not.equal(addr1Pos.encryptedData);
    });
    
    it("Should revert when trying to close a position that is already inactive", async function() {
        const encryptedData = ethers.toUtf8Bytes("some_data");
        await vault.createPosition(encryptedData);
        await vault.closePosition(0); 
        
        await expect(vault.closePosition(0)) 
            .to.be.revertedWithCustomError(vault, "PositionNotActive");
    });
  });
});