/**
 * WhatsApp Bot for Shadow Nox
 * Handles encrypted transaction intents via WhatsApp
 */

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { handleUserIntent } from '../handlers/intentHandler.js';

let whatsappClient = null;

/**
 * Initialize WhatsApp bot
 */
export async function initWhatsAppBot() {
  whatsappClient = new Client({
    authStrategy: new LocalAuth({
      dataPath: process.env.WHATSAPP_SESSION_PATH || './sessions/whatsapp'
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  // QR Code generation for authentication
  whatsappClient.on('qr', (qr) => {
    console.log('📱 WhatsApp QR Code:');
    qrcode.generate(qr, { small: true });
    console.log('Scan this QR code with your WhatsApp mobile app\n');
  });

  // Ready event
  whatsappClient.on('ready', () => {
    console.log('✅ WhatsApp bot is ready and connected!');
  });

  // Message handler
  whatsappClient.on('message', async (message) => {
    try {
      await handleWhatsAppMessage(message);
    } catch (error) {
      console.error('Error handling WhatsApp message:', error);
      await message.reply('❌ Error processing your request. Please try again.');
    }
  });

  // Error handler
  whatsappClient.on('error', (error) => {
    console.error('WhatsApp client error:', error);
  });

  // Initialize the client
  await whatsappClient.initialize();
  
  return whatsappClient;
}

/**
 * Handle incoming WhatsApp messages
 * @param {Object} message - WhatsApp message object
 */
async function handleWhatsAppMessage(message) {
  const userAddress = message.from;
  const messageText = message.body.trim();
  
  // Ignore group messages and non-command messages
  if (message.isGroup || !messageText.startsWith('/')) {
    return;
  }
  
  console.log(`📩 WhatsApp message from ${userAddress}: ${messageText}`);
  
  // Parse and handle user intent
  const response = await handleUserIntent({
    platform: 'whatsapp',
    userAddress,
    message: messageText
  });
  
  // Send response back to user
  await message.reply(response);
}

/**
 * Get WhatsApp client instance
 */
export function getWhatsAppClient() {
  return whatsappClient;
}

