/**
 * Shadow Economy Bots Main Entry Point
 * Initializes WhatsApp and Telegram bots for encrypted transaction relay
 */

import dotenv from 'dotenv';
import { initWhatsAppBot } from './whatsapp/index.js';
import { initTelegramBot } from './telegram/index.js';
import { initLitClient } from './encryption/litClient.js';
import { initEVVMConnector } from './evvm/connector.js';

// Load environment variables
dotenv.config();

/**
 * Initialize all bot services
 */
async function initializeBots() {
  console.log('🌑 Shadow Economy Bots Starting...\n');
  
  try {
    // Initialize Lit Protocol client
    console.log('🔐 Initializing Lit Protocol encryption...');
    await initLitClient();
    console.log('✅ Lit Protocol ready\n');
    
    // Initialize EVVM connector
    console.log('⛓️  Connecting to EVVM virtual blockchain...');
    await initEVVMConnector();
    console.log('✅ EVVM connected\n');
    
    // Initialize Telegram bot
    console.log('📱 Starting Telegram bot...');
    await initTelegramBot();
    console.log('✅ Telegram bot running\n');
    
    // Initialize WhatsApp bot
    console.log('💬 Starting WhatsApp bot...');
    await initWhatsAppBot();
    console.log('✅ WhatsApp bot running\n');
    
    console.log('🚀 All systems operational - Shadow Economy bots ready!\n');
    console.log('📊 Monitoring for encrypted transaction intents...\n');
    
  } catch (error) {
    console.error('❌ Failed to initialize bots:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Shadow Economy bots...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Shadow Economy bots...');
  process.exit(0);
});

// Start the bots
initializeBots();

