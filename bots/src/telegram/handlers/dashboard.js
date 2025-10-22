
import { getArcologyWallet, getArcologyProvider } from '../../arcology/connector.js';
import { ethers } from 'ethers';
import { userWalletManager } from '../userWalletManager.js';

export function getDashboardKeyboard() {
  return [
    [
      { text: '💼 Wallets', callback_data: 'nav_wallets' },
      { text: '💰 Deposit', callback_data: 'nav_deposit' },
      { text: '📊 Portfolio', callback_data: 'nav_portfolio' },
    ],
    [
      { text: '🔄 Trade', callback_data: 'nav_trade' },
      { text: '🏦 Lend', callback_data: 'nav_lend' },
      { text: '⚙️ Settings', callback_data: 'nav_settings' },
    ],
    [
      { text: '📈 Markets', callback_data: 'nav_markets' },
      { text: '🔔 Alerts', callback_data: 'nav_alerts' },
      { text: '❓ Help', callback_data: 'nav_help' },
    ],
  ];
}

/**
 * Generate dashboard text with descriptions
 */
export function getDashboardText(wallet) {
  return (
    '🌑 *Shadow Nox*\n' +
    '*Private DeFi on Arcology*\n\n' +
    'Your bot wallet is ready:\n' +
    '`' + wallet.address + '`\n\n' +
    '*What you can do:*\n' +
    '- 💼 Wallets: View address and balance\n' +
    '- 💰 Deposit: Get deposit details\n' +
    '- 📊 Portfolio: View encrypted positions (coming)\n' +
    '- 🔄 Trade: Submit swap intents\n' +
    '- 🏦 Lend: Submit lending intents\n' +
    '- 📈 Markets: View ETH/BTC from Pyth (placeholder)\n' +
    '- 🔔 Alerts: Toggle sample price alerts\n' +
    '- ⚙️ Settings: Network and stack info\n\n' +
    'Use the menu below to navigate and perform actions:'
  );
}

/**
 * Format ETH balance
 */
export function formatEth(wei) {
  try {
    return ethers.formatEther(wei);
  } catch {
    return '0.0';
  }
}

/**
 * Handle dashboard navigation
 */
export async function handleDashboardNavigation(ctx, data, pushView, popView) {
  const inline_keyboard = getDashboardKeyboard();
  const userId = String(ctx.from.id);
  const userWallet = userWalletManager.getOrCreateUserWallet(userId);
  const provider = getArcologyProvider();

  switch (data) {
    case 'nav_wallets':
      await ctx.answerCbQuery();
      {
        const balanceWei = provider ? await provider.getBalance(userWallet.address) : 0n;
        const balanceEth = formatEth(balanceWei);
        
        // Get network info
        let networkInfo = 'Unknown Network';
        try {
          const network = provider ? await provider.getNetwork() : null;
          if (network) {
            if (network.chainId === 118n) {
              networkInfo = 'Arcology Testnet (Chain ID: 118)';
            }  else {
              networkInfo = `Chain ID: ${network.chainId}`;
            }
          }
        } catch {}
        
        const text = `💼 Your Personal Wallet\n\n**Your Address:**\n\`${userWallet.address}\`\n\n**Balance:** ${balanceEth} ETH\n**Network:** ${networkInfo}\n\n**Actions:**\n- Send funds to this address\n- Use Trade to submit intents\n- All transactions are private to you`;
        const markup = { inline_keyboard: [ ...inline_keyboard, [ { text: '⬅️ Back', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'nav_deposit':
      await ctx.answerCbQuery();
      {
        const text = `💰 Deposit to Your Wallet\n\n**Send ETH or test tokens to YOUR personal address:**\n\`${userWallet.address}\`\n\n**Important:**\n- This is YOUR personal wallet\n- Only YOU control this address\n- Send funds here to start trading/lending\n- All transactions are encrypted and private`;
        const markup = { inline_keyboard: [ ...inline_keyboard, [ { text: '⬅️ Back', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'nav_settings':
      await ctx.answerCbQuery();
      {
        let networkText = 'unknown';
        try {
          const net = provider ? await provider.getNetwork() : null;
          if (net) networkText = `${net.chainId}`;
        } catch {}
        const text = `⚙️ Settings\n\nNetwork Chain ID: ${networkText}\nEncryption: EVVM Native\nOracle: Pyth Hermes (pull)`;
        const markup = { inline_keyboard: [ ...inline_keyboard, [ { text: '⬅️ Back', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'nav_help':
      await ctx.answerCbQuery();
      {
        const text = '❓ Help\n\nUse /help for command list. Buttons perform quick actions.';
        const markup = { inline_keyboard: [ ...inline_keyboard, [ { text: '⬅️ Back', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'nav_back_prev':
      await ctx.answerCbQuery();
      {
        const prev = popView();
        await ctx.editMessageText(prev.text, { parse_mode: 'Markdown', reply_markup: prev.markup });
      }
      break;

    default:
      return false; // Not handled by dashboard
  }
  
  return true; // Handled by dashboard
}
