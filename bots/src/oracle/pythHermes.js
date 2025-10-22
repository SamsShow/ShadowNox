/**
 * Pyth Network - Hermes API Integration
 * 
 * Pyth Pull Oracle via Hermes API for Shadow Economy on Arcology.
 * 
 * Pull Oracle Flow:
 * 1. EVVM Fisher bot fetches latest price feeds from Hermes API
 * 2. Bot calls updatePriceFeeds() on Arcology PythAdapter contract
 * 3. Arcology contracts consume updated prices
 * 4. Only aggregate metrics published (individual positions private)
 * 
 * Hermes API: https://hermes.pyth.network
 * Documentation: https://hermes.pyth.network/docs
 * Price Feed IDs: https://pyth.network/developers/price-feed-ids
 */

import dotenv from 'dotenv';
dotenv.config();

// Hermes API Configuration
const HERMES_URL = process.env.PYTH_HERMES_URL || 'https://hermes.pyth.network';

/**
 * Common Pyth Price Feed IDs
 */
export const PRICE_FEED_IDS = {
  'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'USDC/USD': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'USDT/USD': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'
};

/**
 * Fetch latest price feeds from Pyth Hermes API
 * 
 * @param {Array<string>} priceIds - Array of price feed IDs (with or without 0x prefix)
 * @returns {Promise<Object>} Price feed data with parsed and binary data
 */
export async function fetchPriceFeeds(priceIds) {
  console.log(`Fetching ${priceIds.length} price feeds from Hermes API...`);
  
  try {
    // Build URL with price IDs
    const url = new URL(`${HERMES_URL}/v2/updates/price/latest`);
    
    // Ensure price IDs have 0x prefix for Hermes API
    const formattedIds = priceIds.map(id => id.startsWith('0x') ? id : `0x${id}`);
    formattedIds.forEach(id => url.searchParams.append('ids[]', id));
    
    console.log(`Hermes API request: ${url.toString()}`);
    
    // Fetch from Hermes API
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Hermes API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Hermes returns: { binary: { encoding, data }, parsed: [...] }
    console.log(`✓ Fetched ${data.parsed?.length || 0} price feeds successfully`);
    
    return {
      binary: data.binary || { encoding: 'hex', data: [] },
      parsed: data.parsed || []
    };
  } catch (error) {
    console.error('Error fetching from Hermes API:', error.message);
    throw error;
  }
}

/**
 * Update price feeds on Arcology via CustomPriceOracle contract
 * 
 * @param {Object} oracleContract - CustomPriceOracle contract instance (ethers.js)
 * @param {Array<string>} priceIds - Price feed IDs to update
 * @param {Object} wallet - Wallet to sign transaction (ethers.js signer)
 * @returns {Promise<Object>} Update transaction result
 */
export async function updateOnChainPrices(oracleContract, priceIds, wallet) {
  console.log('Updating price feeds on Arcology via CustomPriceOracle...');
  
  try {
    // Step 1: Fetch latest prices from Hermes API
    const priceData = await fetchPriceFeeds(priceIds);
    
    if (!priceData.parsed || priceData.parsed.length === 0) {
      throw new Error('No price data received from Hermes');
    }
    
    // Step 2: Prepare arrays for batch update
    const updatePriceIds = [];
    const updatePrices = [];
    const updateConfs = [];
    const updateExpos = [];
    const updatePublishTimes = [];
    
    for (const feed of priceData.parsed) {
      const priceObj = feed.price || {};
      
      updatePriceIds.push(feed.id);
      updatePrices.push(priceObj.price || '0');
      updateConfs.push(priceObj.conf || '0');
      updateExpos.push(priceObj.expo || 0);
      updatePublishTimes.push(priceObj.publish_time || Math.floor(Date.now() / 1000));
    }
    
    console.log(`Updating ${updatePriceIds.length} prices on-chain...`);
    
    // Step 3: Call CustomPriceOracle.updatePrices() with batch data
    const tx = await oracleContract.updatePrices(
      updatePriceIds,
      updatePrices,
      updateConfs,
      updateExpos,
      updatePublishTimes
    );
    
    console.log(`Transaction sent: ${tx.hash}`);
    
    // Step 4: Wait for confirmation
    const receipt = await tx.wait();
    
    console.log(`✓ Price feeds updated successfully! Gas used: ${receipt.gasUsed.toString()}`);
    
    return {
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      priceIds: updatePriceIds,
      priceCount: updatePriceIds.length,
      gasUsed: receipt.gasUsed.toString(),
      timestamp: Date.now(),
      status: 'success'
    };
  } catch (error) {
    console.error('Error updating on-chain prices:', error.message);
    throw error;
  }
}

/**
 * Get current price for a specific feed
 * 
 * @param {string} symbol - Price feed symbol (e.g., 'ETH/USD')
 * @returns {Promise<Object>} Current price data
 */
export async function getCurrentPrice(symbol) {
  const priceId = PRICE_FEED_IDS[symbol];
  
  if (!priceId) {
    throw new Error(`Unknown price feed symbol: ${symbol}. Available: ${Object.keys(PRICE_FEED_IDS).join(', ')}`);
  }
  
  console.log(`Fetching current price for ${symbol}...`);
  
  try {
    const priceData = await fetchPriceFeeds([priceId]);
    
    if (!priceData.parsed || priceData.parsed.length === 0) {
      throw new Error(`No price data received for ${symbol}`);
    }
    
    const feed = priceData.parsed[0];
    const price = feed.price || {};
    
    // Calculate human-readable price
    const priceValue = parseInt(price.price || '0');
    const exponent = parseInt(price.expo || 0);
    const humanPrice = priceValue * Math.pow(10, exponent);
    
    console.log(`✓ ${symbol}: $${humanPrice.toFixed(2)}`);
    
    return {
      symbol,
      priceId: feed.id,
      price: price.price,
      expo: price.expo,
      conf: price.conf,
      publishTime: price.publish_time,
      humanReadablePrice: humanPrice,
      formattedPrice: `$${humanPrice.toFixed(2)}`
    };
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Subscribe to price feed updates (WebSocket) - FUTURE ENHANCEMENT
 * 
 * @param {Array<string>} priceIds - Price feed IDs to subscribe
 * @param {Function} onUpdate - Callback for price updates
 * @returns {Object} Subscription object
 */
export function subscribeToPriceFeeds(priceIds, onUpdate) {
  console.log(`[WebSocket subscription not yet implemented]`);
  console.log(`To implement: Use wss://hermes.pyth.network/ws for real-time updates`);
  console.log(`For now, use polling with fetchPriceFeeds() every 5-10 seconds`);
  
  // For MVP, use polling instead of WebSocket
  const intervalId = setInterval(async () => {
    try {
      const priceData = await fetchPriceFeeds(priceIds);
      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate(priceData);
      }
    } catch (error) {
      console.error('Error in price polling:', error.message);
    }
  }, 10000); // Poll every 10 seconds
  
  return {
    unsubscribe: () => {
      clearInterval(intervalId);
      console.log('Unsubscribed from Hermes price feed polling');
    },
    status: 'Polling every 10 seconds (WebSocket coming soon)'
  };
}

/**
 * Update a single price on-chain (helper function)
 * 
 * @param {Object} oracleContract - CustomPriceOracle contract instance
 * @param {string} priceId - Price feed ID
 * @param {string} symbol - Symbol for logging (optional)
 * @returns {Promise<Object>} Transaction result
 */
export async function updateSinglePrice(oracleContract, priceId, symbol = null) {
  console.log(`Updating single price: ${symbol || priceId}...`);
  
  try {
    const priceData = await fetchPriceFeeds([priceId]);
    
    if (!priceData.parsed || priceData.parsed.length === 0) {
      throw new Error('No price data received');
    }
    
    const feed = priceData.parsed[0];
    const price = feed.price || {};
    
    const tx = await oracleContract.updatePrice(
      feed.id,
      price.price || '0',
      price.conf || '0',
      price.expo || 0,
      price.publish_time || Math.floor(Date.now() / 1000)
    );
    
    const receipt = await tx.wait();
    
    console.log(`✓ Price updated! Tx: ${receipt.transactionHash}`);
    
    return {
      txHash: receipt.transactionHash,
      symbol,
      priceId: feed.id,
      status: 'success'
    };
  } catch (error) {
    console.error(`Error updating price for ${symbol || priceId}:`, error.message);
    throw error;
  }
}

/**
 * Continuous price updater (runs in loop)
 * 
 * @param {Object} oracleContract - CustomPriceOracle contract instance
 * @param {Array<string>} priceIds - Price feed IDs to update continuously
 * @param {number} intervalSeconds - Update interval in seconds (default: 30)
 * @returns {Object} Controller object with stop() function
 */
export function startContinuousPriceUpdates(oracleContract, priceIds, intervalSeconds = 30) {
  console.log(`Starting continuous price updates for ${priceIds.length} feeds (every ${intervalSeconds}s)...`);
  
  let running = true;
  
  const updateLoop = async () => {
    while (running) {
      try {
        console.log(`\n[${new Date().toISOString()}] Updating prices...`);
        await updateOnChainPrices(oracleContract, priceIds);
        console.log(`Next update in ${intervalSeconds} seconds...\n`);
      } catch (error) {
        console.error('Update failed:', error.message);
        console.log(`Retrying in ${intervalSeconds} seconds...\n`);
      }
      
      // Wait for interval
      await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
    }
  };
  
  // Start the loop
  updateLoop();
  
  return {
    stop: () => {
      running = false;
      console.log('Stopping continuous price updates...');
    },
    isRunning: () => running
  };
}

