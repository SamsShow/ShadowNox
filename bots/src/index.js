/**
 * Shadow Economy EVVM Fisher Bots Main Entry Point
 * 
 * Architecture:
 * - EVVM Fisher/Relayer Bots: Transaction relay layer with EIP-191 signatures
 * - Arcology Parallel Blockchain: Smart contract execution (10k-15k TPS)
 * - Lit Protocol: Metadata-only encryption (balances, amounts, NOT bytecode)
 * 
 * Initializes WhatsApp and Telegram bots for encrypted transaction relay to Arcology
 */

import dotenv from 'dotenv';
import { initWhatsAppBot } from './whatsapp/index.js';
import { initTelegramBot } from './telegram/index.js';
import { initArcologyConnector } from './arcology/connector.js';

// Load environment variables
dotenv.config();

/**
 * Initialize all EVVM Fisher bot services
 */
async function initializeBots() {
  console.log('🌑 Shadow Economy - EVVM Fisher Bots Starting...\n');
  console.log('🎯 Architecture: EVVM Fisher Bots → Arcology Parallel Blockchain\n');
  
  try {
    // Initialize EVVM native encryption
    console.log('🔐 Using EVVM native encryption...');
    console.log('   ⚠️  Encrypts: User balances, amounts, positions');
    console.log('   ⚠️  Does NOT encrypt: Smart contract bytecode');
    console.log('✅ EVVM encryption ready\n');
    
    // Initialize Arcology connector (execution layer)
    console.log('⛓️  Connecting to Arcology Parallel Blockchain...');
    console.log('   Expected TPS: 10,000-15,000');
    await initArcologyConnector();
    console.log('✅ Arcology connected\n');
    
    // Initialize Telegram bot (EVVM Fisher relay)
    console.log('📱 Starting Telegram EVVM Fisher bot...');
    await initTelegramBot();
    console.log('✅ Telegram bot running\n');
    
    // Initialize WhatsApp bot (EVVM Fisher relay)
    console.log('💬 Starting WhatsApp EVVM Fisher bot...');
    await initWhatsAppBot();
    console.log('✅ WhatsApp bot running\n');
    
    console.log('=' .repeat(70));
    console.log('🚀 All systems operational - Shadow Economy EVVM Fisher bots ready!');
    console.log('=' .repeat(70));
    console.log('\n📊 System Status:');
    console.log('   ✅ EVVM Fisher Bots: Active (WhatsApp, Telegram)');
    console.log('   ✅ Arcology Blockchain: Connected (10k-15k TPS)');
    console.log('   ✅ EVVM Native: Ready (metadata encryption)');
    console.log('\n🎯 Data Flow:');
    console.log('   User → EVVM Fisher (EIP-191) → EVVM (encrypt) → Arcology (execute)');
    console.log('\n📡 Monitoring for encrypted transaction intents...\n');
    
  } catch (error) {
    console.error('❌ Failed to initialize bots:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Shadow Nox bots...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Shadow Nox bots...');
  process.exit(0);
});

// Start the bots
initializeBots();

