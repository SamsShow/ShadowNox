const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PythAdapter", function () {
  let mockPyth, pythAdapter;
  let owner, relayer;
  let tokenAddress;
  const pythPriceId = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"; // Example ETH/USD

  beforeEach(async function () {
    [owner, relayer] = await ethers.getSigners();
    tokenAddress = await ethers.Wallet.createRandom().getAddress();

    const MockPythFactory = await ethers.getContractFactory("MockPyth");
    mockPyth = await MockPythFactory.deploy();
    await mockPyth.waitForDeployment();
    const mockPythAddress = await mockPyth.getAddress();

    const PythAdapterFactory = await ethers.getContractFactory("PythAdapter");
    pythAdapter = await PythAdapterFactory.connect(owner).deploy(mockPythAddress);
    await pythAdapter.waitForDeployment();
  });

  describe("Configuration", function () {
    it("Should allow the owner to set a price feed ID", async function () {
      await expect(pythAdapter.connect(owner).setPriceId(tokenAddress, pythPriceId))
        .to.emit(pythAdapter, "PriceIdSet")
        .withArgs(tokenAddress, pythPriceId);

      // FIX: Set a valid price in the mock before calling the getter.
      const block = await ethers.provider.getBlock('latest');
      await mockPyth.setPrice(pythPriceId, 3000 * 10**8, 10 * 10**8, -8, block.timestamp);

      // This assertion should now pass because a valid, recent price exists.
      await expect(pythAdapter.getLatestPrice(tokenAddress)).to.not.be.reverted;
    });

    it("Should prevent non-owners from setting a price feed ID", async function () {
      await expect(pythAdapter.connect(relayer).setPriceId(tokenAddress, pythPriceId))
        .to.be.revertedWithCustomError(pythAdapter, "NotOwner");
    });
  });

  describe("Price Fetching and Metric Updates", function () {
    const mockPrice = 3500 * 10**8;
    const mockConf = 10 * 10**8;
    const mockExpo = -8;
    
    beforeEach(async function () {
      await pythAdapter.connect(owner).setPriceId(tokenAddress, pythPriceId);
      const block = await ethers.provider.getBlock('latest');
      await mockPyth.setPrice(pythPriceId, mockPrice, mockConf, mockExpo, block.timestamp);
      await mockPyth.setUpdateFee(ethers.parseEther("0.01"));
    });

    it("Should get the latest price from the mock Pyth contract", async function () {
      const price = await pythAdapter.getLatestPrice(tokenAddress);
      expect(price.price).to.equal(mockPrice);
      expect(price.conf).to.equal(mockConf);
    });

    it("Should allow the owner (relayer) to update aggregate metrics", async function () {
      const liquidityChange = ethers.parseEther("100");
      const volume = ethers.parseEther("10");
      const updateFee = ethers.parseEther("0.01");

      await expect(pythAdapter.connect(owner).updateAggregateMetrics(
        tokenAddress,
        liquidityChange,
        volume,
        [],
        { value: updateFee }
      )).to.emit(pythAdapter, "MetricsUpdated");

      const metrics = await pythAdapter.getAggregateMetrics(tokenAddress);
      expect(metrics.totalLiquidity).to.equal(liquidityChange);
      expect(metrics.totalVolume).to.equal(volume);
      expect(metrics.lastPrice).to.equal(mockPrice);
    });
    
    it("Should handle negative liquidity changes", async function () {
        const initialLiquidity = ethers.parseEther("200");
        const liquidityChange = -ethers.parseEther("50");
        const updateFee = ethers.parseEther("0.01");

        await pythAdapter.connect(owner).updateAggregateMetrics(tokenAddress, initialLiquidity, 0, [], { value: updateFee });
        
        await pythAdapter.connect(owner).updateAggregateMetrics(tokenAddress, liquidityChange, 0, [], { value: updateFee });

        const metrics = await pythAdapter.getAggregateMetrics(tokenAddress);
        expect(metrics.totalLiquidity).to.equal(ethers.parseEther("150"));
    });

    it("Should revert if a non-owner tries to update metrics", async function () {
      await expect(pythAdapter.connect(relayer).updateAggregateMetrics(tokenAddress, 100, 10, [], { value: 1 }))
        .to.be.revertedWithCustomError(pythAdapter, "NotOwner");
    });
  });
});