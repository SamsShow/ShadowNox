/**
 * Fund Wallets from Source
 * Send ETH from a funded wallet to bot and user wallets
 */

import dotenv from 'dotenv';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { arcologyConfig } from '../config/arcology.config.js';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fundWallets() {
  console.log('🌑 Shadow Economy - Programmatic Wallet Funding\n');
  console.log('=' .repeat(70));
  console.log('⚠️  You need a funded Sepolia wallet to use this script');
  console.log('=' .repeat(70) + '\n');

  const sourcePrivateKey = await question('Enter your funded wallet private key (starts with 0x): ');
  
  if (!sourcePrivateKey || !sourcePrivateKey.startsWith('0x')) {
    console.log('❌ Invalid private key format');
    rl.close();
    return;
  }

  const provider = new ethers.JsonRpcProvider(arcologyConfig.rpcUrl);
  const sourceWallet = new ethers.Wallet(sourcePrivateKey, provider);
  
  console.log(`\n📡 Connected to: Arcology Testnet (Chain ID: 118)`);
  console.log(`💰 Source Wallet: ${sourceWallet.address}`);
  
  const sourceBalance = await provider.getBalance(sourceWallet.address);
  const sourceBalanceEth = ethers.formatEther(sourceBalance);
  console.log(`💵 Source Balance: ${sourceBalanceEth} ETH\n`);
  
  if (parseFloat(sourceBalanceEth) < 0.1) {
    console.log('❌ Insufficient balance in source wallet');
    rl.close();
    return;
  }

  const amountPerWallet = await question('Amount to send to each wallet (in ETH, e.g., 0.1): ');
  const amountEth = parseFloat(amountPerWallet);
  
  if (isNaN(amountEth) || amountEth <= 0) {
    console.log('❌ Invalid amount');
    rl.close();
    return;
  }

  console.log('\n' + '=' .repeat(70));
  console.log('📋 WALLETS TO FUND:\n');

  const walletsToFund = [];

  // 1. Bot Wallet
  const botPrivateKey = process.env.BOT_PRIVATE_KEY;
  if (botPrivateKey) {
    const botWallet = new ethers.Wallet(botPrivateKey);
    const balance = await provider.getBalance(botWallet.address);
    const balanceEth = ethers.formatEther(balance);
    
    console.log('💼 Bot Wallet');
    console.log(`   Address: ${botWallet.address}`);
    console.log(`   Current: ${balanceEth} ETH`);
    console.log(`   Will send: ${amountEth} ETH\n`);
    
    walletsToFund.push({ name: 'Bot Wallet', address: botWallet.address });
  }

  // 2. User Wallets
  const userWalletsPath = path.resolve(process.cwd(), '.user_wallets.json');
  if (fs.existsSync(userWalletsPath)) {
    const userData = JSON.parse(fs.readFileSync(userWalletsPath, 'utf-8'));
    for (const [userId, data] of Object.entries(userData)) {
      const balance = await provider.getBalance(data.address);
      const balanceEth = ethers.formatEther(balance);
      
      console.log(`👤 User ${userId}`);
      console.log(`   Address: ${data.address}`);
      console.log(`   Current: ${balanceEth} ETH`);
      console.log(`   Will send: ${amountEth} ETH\n`);
      
      walletsToFund.push({ name: `User ${userId}`, address: data.address });
    }
  }

  const totalNeeded = walletsToFund.length * amountEth;
  console.log('=' .repeat(70));
  console.log(`📊 SUMMARY: ${walletsToFund.length} wallets × ${amountEth} ETH = ${totalNeeded} ETH needed`);
  console.log(`💵 You have: ${sourceBalanceEth} ETH\n`);

  if (parseFloat(sourceBalanceEth) < totalNeeded) {
    console.log('❌ Insufficient balance for all transfers');
    rl.close();
    return;
  }

  const confirm = await question('Proceed with funding? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('❌ Cancelled');
    rl.close();
    return;
  }

  console.log('\n🚀 Starting transfers...\n');

  for (const wallet of walletsToFund) {
    try {
      console.log(`📤 Sending ${amountEth} ETH to ${wallet.name}...`);
      const tx = await sourceWallet.sendTransaction({
        to: wallet.address,
        value: ethers.parseEther(amountEth.toString())
      });
      
      console.log(`   TX Hash: ${tx.hash}`);
      console.log(`   Waiting for confirmation...`);
      
      await tx.wait();
      console.log(`   ✅ Confirmed!\n`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
    }
  }

  console.log('=' .repeat(70));
  console.log('✅ Funding complete!');
  console.log('\nRun: node scripts/check-balances.js to verify\n');
  
  rl.close();
}

fundWallets().catch(console.error);
