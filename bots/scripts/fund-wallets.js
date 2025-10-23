/**
 * Fund Wallets Script
 * Get wallet addresses and instructions to fund them with Sepolia ETH
 */

import dotenv from 'dotenv';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

dotenv.config();

console.log('🌑 Shadow Economy - Wallet Funding Guide\n');
console.log('=' .repeat(70));

// 1. Bot Wallet
const botPrivateKey = process.env.BOT_PRIVATE_KEY;
if (botPrivateKey) {
  const botWallet = new ethers.Wallet(botPrivateKey);
  console.log('\n💼 BOT WALLET (Relay/Fisher Bot)');
  console.log('   Address:', botWallet.address);
  console.log('   Usage: Relays transactions, gas fees');
} else {
  console.log('\n⚠️  BOT_PRIVATE_KEY not set in .env file');
}

// 2. User Wallets (check if any exist)
const userWalletsPath = path.resolve(process.cwd(), '.user_wallets.json');
if (fs.existsSync(userWalletsPath)) {
  console.log('\n👥 USER WALLETS (Personal wallets per Telegram user)');
  try {
    const userData = JSON.parse(fs.readFileSync(userWalletsPath, 'utf-8'));
    Object.entries(userData).forEach(([userId, data]) => {
      console.log(`\n   User ID: ${userId}`);
      console.log(`   Address: ${data.address}`);
    });
  } catch (e) {
    console.log('   Error reading user wallets:', e.message);
  }
} else {
  console.log('\n👥 USER WALLETS');
  console.log('   No user wallets created yet.');
  console.log('   User wallets are auto-generated when users use /start in Telegram');
}

console.log('\n' + '=' .repeat(70));
console.log('\n💰 HOW TO FUND THESE WALLETS WITH SEPOLIA ETH:\n');

console.log('📌 OPTION 1: Sepolia Faucets (Recommended)');
console.log('   Visit any of these faucets and paste the wallet address:');
console.log('   • https://sepoliafaucet.com/');
console.log('   • https://www.alchemy.com/faucets/ethereum-sepolia');
console.log('   • https://sepolia-faucet.pk910.de/');
console.log('   • https://faucet.quicknode.com/ethereum/sepolia\n');

console.log('📌 OPTION 2: Transfer from MetaMask');
console.log('   1. Add Sepolia network to MetaMask');
console.log('   2. Get Sepolia ETH from a faucet to your MetaMask');
console.log('   3. Send ETH to the wallet addresses above\n');

console.log('📌 OPTION 3: Programmatic Funding (if you have a funded wallet)');
console.log('   Use the fund-from-wallet.js script with your funded wallet\n');

console.log('=' .repeat(70));
console.log('\n💡 RECOMMENDATIONS:');
console.log('   • Bot Wallet: Fund with 0.5-1 ETH (for gas fees)');
console.log('   • User Wallets: Fund with 0.1-0.5 ETH each (for testing swaps)');
console.log('   • Sepolia ETH is free and has no real value\n');

console.log('🔍 TO CHECK BALANCES:');
console.log('   Run: node scripts/check-balances.js\n');
