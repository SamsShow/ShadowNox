import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class UserWalletManager {
  constructor() {
    this.userWalletsFile = path.resolve(process.cwd(), 'bots', '.user_wallets.json');
    this.userWallets = this.loadUserWallets();
  }

  loadUserWallets() {
    try {
      if (fs.existsSync(this.userWalletsFile)) {
        const data = JSON.parse(fs.readFileSync(this.userWalletsFile, 'utf-8'));
        return data || {};
      }
    } catch (error) {
      console.warn('Could not load user wallets file:', error.message);
    }
    return {};
  }

  saveUserWallets() {
    try {
      fs.writeFileSync(this.userWalletsFile, JSON.stringify(this.userWallets, null, 2), { encoding: 'utf-8' });
    } catch (error) {
      console.error('Could not save user wallets:', error.message);
    }
  }

  generateUserWallet(userId) {
    const wallet = ethers.Wallet.createRandom();
    
    // Store encrypted private key
    const encryptedKey = this.encryptPrivateKey(wallet.privateKey, userId);
    
    this.userWallets[userId] = {
      address: wallet.address,
      encryptedPrivateKey: encryptedKey,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    this.saveUserWallets();
    
    console.log(`🆕 Generated personal wallet for user ${userId}: ${wallet.address}`);
    return wallet;
  }

  getUserWallet(userId) {
    const userWalletData = this.userWallets[userId];
    
    if (!userWalletData) {
      return null;
    }
    
    try {
      const privateKey = this.decryptPrivateKey(userWalletData.encryptedPrivateKey, userId);
      const wallet = new ethers.Wallet(privateKey);
      
      // Update last used
      userWalletData.lastUsed = new Date().toISOString();
      this.saveUserWallets();
      
      return wallet;
    } catch (error) {
      console.error(`Error decrypting wallet for user ${userId}:`, error.message);
      return null;
    }
  }

  getOrCreateUserWallet(userId) {
    let wallet = this.getUserWallet(userId);
    
    if (!wallet) {
      wallet = this.generateUserWallet(userId);
    }
    
    return wallet;
  }

  encryptPrivateKey(privateKey, userId) {
    // XOR encryption with user ID
    const key = crypto.createHash('sha256').update(userId).digest();
    const encrypted = Buffer.alloc(privateKey.length);
    
    for (let i = 0; i < privateKey.length; i++) {
      encrypted[i] = privateKey.charCodeAt(i) ^ key[i % key.length];
    }
    
    return encrypted.toString('base64');
  }

  decryptPrivateKey(encryptedKey, userId) {
    const key = crypto.createHash('sha256').update(userId).digest();
    const encrypted = Buffer.from(encryptedKey, 'base64');
    const decrypted = Buffer.alloc(encrypted.length);
    
    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ key[i % key.length];
    }
    
    return decrypted.toString();
  }

  getUserAddress(userId) {
    const userWalletData = this.userWallets[userId];
    return userWalletData ? userWalletData.address : null;
  }

  hasUserWallet(userId) {
    return userId in this.userWallets;
  }

  getAllUserWallets() {
    return Object.keys(this.userWallets).map(userId => ({
      userId,
      address: this.userWallets[userId].address,
      createdAt: this.userWallets[userId].createdAt,
      lastUsed: this.userWallets[userId].lastUsed
    }));
  }
}

export const userWalletManager = new UserWalletManager();
