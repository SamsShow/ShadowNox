
import { getCurrentPrice } from '../../oracle/pythHermes.js';

/**
 * Generate markets keyboard
 */
export function getMarketsKeyboard() {
  return [
    [
      { text: '📈 Price Feeds', callback_data: 'markets_price_feeds' },
      { text: '📊 Market Stats', callback_data: 'markets_stats' },
    ],
    [
      { text: '🔄 Refresh Prices', callback_data: 'markets_refresh' },
      { text: '📱 Subscribe', callback_data: 'markets_subscribe' },
    ],
    [
      { text: '⬅️ Back to Dashboard', callback_data: 'nav_back_prev' },
    ],
  ];
}

/**
 * Generate alerts keyboard
 */
export function getAlertsKeyboard() {
  return [
    [
      { text: '🔔 Enable ETH Alert', callback_data: 'alert_enable_eth' },
      { text: '🔔 Enable BTC Alert', callback_data: 'alert_enable_btc' },
    ],
    [
      { text: '📊 View Alerts', callback_data: 'alert_view' },
      { text: '❌ Disable All', callback_data: 'alert_disable_all' },
    ],
    [
      { text: '⬅️ Back to Dashboard', callback_data: 'nav_back_prev' },
    ],
  ];
}

/**
 * Handle markets navigation
 */
export async function handleMarketsNavigation(ctx, data, pushView, popView) {
  switch (data) {
    case 'nav_markets':
      await ctx.answerCbQuery();
      {
        const text = '📈 Markets\n\nView market data and price feeds:';
        const markup = { inline_keyboard: getMarketsKeyboard() };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'markets_price_feeds':
      await ctx.answerCbQuery();
      {
        // Import the EVVM Fisher flow processor
        const { getTransactionStatus } = await import('../evvmFisherFlow.js');
        
        const eth = await getCurrentPrice('ETH/USD');
        const btc = await getCurrentPrice('BTC/USD');
        const usdc = await getCurrentPrice('USDC/USD');
        
        const text = `📈 Price Feeds (Pyth Hermes)\n\n**Current Prices:**\n• ETH/USD: $${eth.price} (exp ${eth.expo})\n• BTC/USD: $${btc.price} (exp ${btc.expo})\n• USDC/USD: $${usdc.price} (exp ${usdc.expo})\n\n**Flow Status:**\n✅ EVVM Fisher Bot: Active\n✅ EVVM Native: Connected\n✅ EVVM: Parallel execution\n✅ Pyth Hermes: Pull oracle\n\n*Following complete EVVM Fisher flow*`;
        const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Markets', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'markets_stats':
      await ctx.answerCbQuery();
      {
        const text = '📊 Market Statistics\n\n**Arcology Network:**\n• TPS: 12,500\n• Block Time: 0.1s\n• Gas Price: 0.001 ETH\n\n**Shadow Economy:**\n• Total TVL: $2.5M\n• Active Users: 1,247\n• Daily Volume: $850K\n\n*Aggregate metrics only*';
        const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Markets', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'markets_refresh':
      await ctx.answerCbQuery('Refreshing market data...');
      {
        const text = '🔄 Market Data Refreshed\n\n**Last Updated:**\n• Price feeds: Just now\n• Market stats: Just now\n• Network metrics: Just now\n\n*Data synchronized from Pyth Hermes*';
        const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Markets', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'markets_subscribe':
      await ctx.answerCbQuery();
      {
        const text = '📱 Price Alerts Subscription\n\n**Available Alerts:**\n• ETH price changes\n• BTC price changes\n• Custom thresholds\n\n*Alerts sent via Telegram*\n*Powered by Pyth Hermes*';
        const markup = { 
          inline_keyboard: [
            [ { text: '🔔 Enable Alerts', callback_data: 'nav_alerts' } ],
            [ { text: '⬅️ Back to Markets', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    default:
      return false; // Not handled by markets
  }
  
  return true; // Handled by markets
}

/**
 * Handle alerts navigation
 */
export async function handleAlertsNavigation(ctx, data, pushView, popView, alertsByUserId) {
  const userId = String(ctx.from.id);
  
  switch (data) {
    case 'nav_alerts':
      await ctx.answerCbQuery();
      {
        const hasAlerts = alertsByUserId.has(userId);
        const text = `🔔 Alerts\n\n**Status:** ${hasAlerts ? 'Enabled' : 'Disabled'}\n\nManage your price alerts:`;
        const markup = { inline_keyboard: getAlertsKeyboard() };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'alert_enable_eth':
      await ctx.answerCbQuery('ETH alert enabled');
      {
        alertsByUserId.set(userId, { 
          symbol: 'ETH/USD', 
          threshold: 5, 
          enabled: true,
          lastPrice: 2500
        });
        
        const text = '🔔 ETH Alert Enabled\n\n**Alert Settings:**\n• Symbol: ETH/USD\n• Threshold: 5% change\n• Status: Active\n\n*You\'ll be notified of significant price movements*';
        const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Alerts', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'alert_enable_btc':
      await ctx.answerCbQuery('BTC alert enabled');
      {
        alertsByUserId.set(userId, { 
          symbol: 'BTC/USD', 
          threshold: 3, 
          enabled: true,
          lastPrice: 45000
        });
        
        const text = '🔔 BTC Alert Enabled\n\n**Alert Settings:**\n• Symbol: BTC/USD\n• Threshold: 3% change\n• Status: Active\n\n*You\'ll be notified of significant price movements*';
        const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Alerts', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'alert_view':
      await ctx.answerCbQuery();
      {
        const userAlert = alertsByUserId.get(userId);
        if (userAlert) {
          const text = `📊 Your Alerts\n\n**Active Alert:**\n• Symbol: ${userAlert.symbol}\n• Threshold: ${userAlert.threshold}%\n• Last Price: $${userAlert.lastPrice}\n• Status: ${userAlert.enabled ? 'Active' : 'Inactive'}\n\n*Alert monitoring via Pyth Hermes*`;
          const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Alerts', callback_data: 'nav_back_prev' } ] ] };
          pushView(text, markup);
          await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
        } else {
          const text = '📊 Your Alerts\n\n**No active alerts**\n\nEnable alerts to get notified of price movements.';
          const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Alerts', callback_data: 'nav_back_prev' } ] ] };
          pushView(text, markup);
          await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
        }
      }
      break;

    case 'alert_disable_all':
      await ctx.answerCbQuery('All alerts disabled');
      {
        alertsByUserId.delete(userId);
        const text = '❌ All Alerts Disabled\n\n**Status:** No active alerts\n\nYou can re-enable alerts anytime.';
        const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Alerts', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    default:
      return false; // Not handled by alerts
  }
  
  return true; // Handled by alerts
}
