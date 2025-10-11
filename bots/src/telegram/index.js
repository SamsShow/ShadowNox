/**
 * Telegram Bot for Shadow Nox
 * Handles encrypted transaction intents via Telegram
 */

import { Telegraf } from 'telegraf';
import { handleUserIntent } from '../handlers/intentHandler.js';

let telegramBot = null;

/**
 * Initialize Telegram bot
 */
export async function initTelegramBot() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not set in environment variables');
  }

  telegramBot = new Telegraf(botToken);

  // Start command
  telegramBot.start((ctx) => {
    ctx.reply(
      '🌑 *Welcome to Shadow Nox*\n\n' +
      'Your private DeFi interface powered by EVVM\n\n' +
      'Available commands:\n' +
      '/swap - Swap tokens privately\n' +
      '/lend - Lend assets\n' +
      '/portfolio - View your encrypted portfolio\n' +
      '/withdraw - Withdraw funds\n' +
      '/help - Show this help message\n\n' +
      'All transactions are end-to-end encrypted via Lit Protocol 🔐',
      { parse_mode: 'Markdown' }
    );
  });

  // Help command
  telegramBot.help((ctx) => {
    ctx.reply(
      '📚 *Shadow Nox Commands*\n\n' +
      '*Trading:*\n' +
      '/swap <amount> <from> <to> - Private token swap\n' +
      'Example: /swap 1 ETH USDC\n\n' +
      '*Lending:*\n' +
      '/lend <amount> <token> - Lend assets\n' +
      'Example: /lend 1000 USDC\n\n' +
      '*Portfolio:*\n' +
      '/portfolio - View your encrypted positions\n' +
      '/withdraw <amount> <token> - Withdraw funds\n\n' +
      '*Info:*\n' +
      '/metrics - View aggregate market metrics\n' +
      '/status - Check system status',
      { parse_mode: 'Markdown' }
    );
  });

  // Generic command handler
  telegramBot.on('text', async (ctx) => {
    try {
      const userAddress = ctx.from.id.toString();
      const messageText = ctx.message.text.trim();
      
      console.log(`📩 Telegram message from ${userAddress}: ${messageText}`);
      
      // Parse and handle user intent
      const response = await handleUserIntent({
        platform: 'telegram',
        userAddress,
        message: messageText
      });
      
      // Send response back to user
      await ctx.reply(response, { parse_mode: 'Markdown' });
      
    } catch (error) {
      console.error('Error handling Telegram message:', error);
      await ctx.reply('❌ Error processing your request. Please try again.');
    }
  });

  // Error handler
  telegramBot.catch((err, ctx) => {
    console.error('Telegram bot error:', err);
    ctx.reply('❌ An error occurred. Please try again later.');
  });

  // Launch the bot
  await telegramBot.launch();
  
  console.log('✅ Telegram bot is running!');
  
  return telegramBot;
}

/**
 * Get Telegram bot instance
 */
export function getTelegramBot() {
  return telegramBot;
}

/**
 * Graceful shutdown
 */
export async function stopTelegramBot() {
  if (telegramBot) {
    await telegramBot.stop('SIGTERM');
  }
}

