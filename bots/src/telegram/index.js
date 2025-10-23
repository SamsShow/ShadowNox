/**
 * Telegram Bot for Shadow Nox
 * Main bot entry point with modular handlers
 */

import { Telegraf } from 'telegraf';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Import handlers
import { handleDashboardNavigation, getDashboardText, getDashboardKeyboard } from './handlers/dashboard.js';
import { handleTradeNavigation, handleTradeText } from './handlers/trade.js';
import { handleLendNavigation, handleLendText } from './handlers/lend.js';
import { handlePortfolioNavigation } from './handlers/portfolio.js';
import { handleMarketsNavigation, handleAlertsNavigation } from './handlers/markets.js';
import { TelegramStateManager } from './stateManager.js';
import { userWalletManager } from './userWalletManager.js';
import { handleUserIntent } from '../handlers/intentHandler.js';

dotenv.config();

let telegramBot = null;
const stateManager = new TelegramStateManager();

/**
 * Ensure bot wallet exists: use BOT_PRIVATE_KEY if provided,
 * otherwise generate and persist locally to bots/.bot_wallet.json
 */
function ensureBotWallet() {
  // If already provided via env, nothing to do
  if (process.env.BOT_PRIVATE_KEY && process.env.BOT_PRIVATE_KEY.trim().length > 0) {
    const wallet = new ethers.Wallet(process.env.BOT_PRIVATE_KEY.trim());
    return wallet;
  }

  const walletFile = path.resolve(process.cwd(), 'bots', '.bot_wallet.json');
  try {
    if (fs.existsSync(walletFile)) {
      const data = JSON.parse(fs.readFileSync(walletFile, 'utf-8'));
      if (data && data.privateKey) {
        process.env.BOT_PRIVATE_KEY = data.privateKey;
        return new ethers.Wallet(data.privateKey);
      }
    }
  } catch (e) {
    // fall through to generation
  }

  const newWallet = ethers.Wallet.createRandom();
  const persisted = {
    address: newWallet.address,
    privateKey: newWallet.privateKey,
    createdAt: new Date().toISOString(),
  };
  try {
    fs.writeFileSync(walletFile, JSON.stringify(persisted, null, 2), { encoding: 'utf-8' });
    process.env.BOT_PRIVATE_KEY = newWallet.privateKey;
    console.log(`🆕 Generated bot wallet: ${newWallet.address}\n   Saved to bots/.bot_wallet.json (gitignore recommended)`);
  } catch (e) {
    console.warn('Could not persist generated wallet to file. Using in-memory only.');
  }
  return newWallet;
}

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
  telegramBot.start(async (ctx) => {
    const userId = String(ctx.from.id);
    
    // Get or create personal wallet for this user
    const userWallet = userWalletManager.getOrCreateUserWallet(userId);
    
    const dashboardText = getDashboardText(userWallet);
    const inline_keyboard = getDashboardKeyboard();
    const markup = { inline_keyboard };
    
    await ctx.reply(dashboardText, {
      parse_mode: 'Markdown',
      reply_markup: markup,
    });
    
    // Reset view stack for this chat
    stateManager.resetViewStack(String(ctx.chat.id), { text: dashboardText, markup });
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

  // Callback query handler
  telegramBot.on('callback_query', async (ctx) => {
    const data = ctx.update.callback_query?.data;
    const chatId = String(ctx.chat.id);
    const userId = String(ctx.from.id);
    
    const pushView = (text, markup) => {
      stateManager.pushView(chatId, text, markup);
    };
    
    const popView = () => {
      return stateManager.popView(chatId);
    };
    
    const goHome = () => {
      const userWallet = userWalletManager.getOrCreateUserWallet(userId);
      const dashboardText = getDashboardText(userWallet);
      const markup = { inline_keyboard: getDashboardKeyboard() };
      stateManager.resetViewStack(chatId, { text: dashboardText, markup });
      return { text: dashboardText, markup };
    };

    try {
      // Handle global home navigation
      if (data === 'nav_home') {
        await ctx.answerCbQuery();
        const home = goHome();
        await ctx.editMessageText(home.text, { parse_mode: 'Markdown', reply_markup: home.markup });
        return;
      }
      
      // Try each handler in order
      let handled = false;
      
      // Dashboard handler
      if (!handled) {
        handled = await handleDashboardNavigation(ctx, data, pushView, popView, goHome);
      }
      
      // Trade handler
      if (!handled) {
        handled = await handleTradeNavigation(ctx, data, pushView, popView, stateManager.userStates);
      }
      
      // Lend handler
      if (!handled) {
        handled = await handleLendNavigation(ctx, data, pushView, popView, stateManager.userStates);
      }
      
      // Portfolio handler
      if (!handled) {
        handled = await handlePortfolioNavigation(ctx, data, pushView, popView);
      }
      
      // Markets handler
      if (!handled) {
        handled = await handleMarketsNavigation(ctx, data, pushView, popView);
      }
      
      // Alerts handler
      if (!handled) {
        handled = await handleAlertsNavigation(ctx, data, pushView, popView, stateManager.alertsByUserId);
      }
      
      if (!handled) {
        await ctx.answerCbQuery('Unsupported action');
      }
      
    } catch (err) {
      console.error('Callback handler error:', err);
      try { 
        await ctx.answerCbQuery('Error occurred'); 
      } catch {}
    }
  });

  // Text message handler
  telegramBot.on('text', async (ctx) => {
    try {
      const userId = String(ctx.from.id);
      const messageText = ctx.message.text.trim();
      
      console.log(`📩 Telegram message from ${userId}: ${messageText}`);
      
      // Check if user is in a conversational state
      const userState = stateManager.getUserState(userId);
      
      if (userState) {
        // Handle conversational flow
        let handled = false;
        
        if (userState.action === 'custom_swap') {
          handled = await handleTradeText(ctx, messageText, stateManager.pushView.bind(stateManager, String(ctx.chat.id)), stateManager.userStates);
        } else if (userState.action === 'custom_lend') {
          handled = await handleLendText(ctx, messageText, stateManager.pushView.bind(stateManager, String(ctx.chat.id)), stateManager.userStates);
        }
        
        if (handled) {
          return; // Message handled by conversational flow
        }
      }
      
      // Fall back to generic intent handler
      const response = await handleUserIntent({
        platform: 'telegram',
        userAddress: userId,
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
    if (ctx && ctx.reply) {
      ctx.reply('❌ An error occurred. Please try again later.');
    }
  });

  // Launch the bot with timeout and polling options
  console.log('🔄 Launching Telegram bot...');
  try {
    await Promise.race([
      telegramBot.launch({
        dropPendingUpdates: true,
        allowedUpdates: ['message', 'callback_query']
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Telegram launch timeout after 30s')), 30000)
      )
    ]);
    console.log('✅ Telegram bot is running!');
    console.log('   Bot username: @ShadowNox_BOT');
  } catch (error) {
    console.error('❌ Failed to launch Telegram bot:', error.message);
    throw error;
  }
  
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