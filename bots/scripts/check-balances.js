/**
 * Check Wallet Balances
 * View ETH balances for all wallets in the system
 */

import dotenv from 'dotenv';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { arcologyConfig } from '../config/arcology.config.js';

dotenv.config();

async function checkBalances() {
  console.log('🌑 Shadow Economy - Wallet Balances\n');
  console.log('=' .repeat(70));
  
  const provider = new ethers.JsonRpcProvider(arcologyConfig.rpcUrl);
  
  console.log('📡 Connected to: Arcology Testnet (Chain ID: 118)');
  console.log('=' .repeat(70) + '\n');

  // 1. Check Bot Wallet
  const botPrivateKey = process.env.BOT_PRIVATE_KEY;
  if (botPrivateKey) {
    try {
      const botWallet = new ethers.Wallet(botPrivateKey);
      const balance = await provider.getBalance(botWallet.address);
      const balanceEth = ethers.formatEther(balance);
      
      console.log('💼 BOT WALLET (Relay/Fisher Bot)');
      console.log(`   Address: ${botWallet.address}`);
      console.log(`   Balance: ${balanceEth} ETH`);
      
      if (parseFloat(balanceEth) < 0.1) {
        console.log('   ⚠️  LOW BALANCE! Fund this wallet for gas fees');
      } else {
        console.log('   ✅ Balance OK');
      }
    } catch (e) {
      console.log('   ❌ Error checking bot wallet:', e.message);
    }
  } else {
    console.log('💼 BOT WALLET');
    console.log('   ⚠️  BOT_PRIVATE_KEY not set in .env file');
  }

  // 2. Check User Wallets
  const userWalletsPath = path.resolve(process.cwd(), '.user_wallets.json');
  if (fs.existsSync(userWalletsPath)) {
    console.log('\n👥 USER WALLETS');
    try {
      const userData = JSON.parse(fs.readFileSync(userWalletsPath, 'utf-8'));
      const entries = Object.entries(userData);
      
      if (entries.length === 0) {
        console.log('   No user wallets created yet');
      } else {
        for (const [userId, data] of entries) {
          const balance = await provider.getBalance(data.address);
          const balanceEth = ethers.formatEther(balance);
          
          console.log(`\n   User ID: ${userId}`);
          console.log(`   Address: ${data.address}`);
          console.log(`   Balance: ${balanceEth} ETH`);
          
          if (parseFloat(balanceEth) === 0) {
            console.log('   ⚠️  EMPTY - Fund this wallet for testing');
          } else if (parseFloat(balanceEth) < 0.05) {
            console.log('   ⚠️  LOW BALANCE');
          } else {
            console.log('   ✅ Balance OK');
          }
        }
      }
    } catch (e) {
      console.log('   ❌ Error reading user wallets:', e.message);
    }
  } else {
    console.log('\n👥 USER WALLETS');
    console.log('   No user wallets file found');
    console.log('   Users will auto-generate wallets when they use /start in Telegram');
  }

  console.log('\n' + '=' .repeat(70));
  console.log('\n💡 To fund wallets, run: node scripts/fund-wallets.js');
  console.log('   This will show you all wallet addresses and faucet links\n');
}

checkBalances().catch(console.error);
