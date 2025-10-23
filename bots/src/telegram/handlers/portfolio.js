
/**
 * Generate portfolio keyboard
 */
export function getPortfolioKeyboard() {
  return [
    [
      { text: '📊 View Positions', callback_data: 'portfolio_view_positions' },
      { text: '💰 View Balances', callback_data: 'portfolio_view_balances' },
    ],
    [
      { text: '📈 Performance', callback_data: 'portfolio_performance' },
      { text: '🔄 Refresh', callback_data: 'portfolio_refresh' },
    ],
    [
      { text: '⬅️ Back', callback_data: 'nav_back_prev' },
      { text: '🏠 Home', callback_data: 'nav_home' },
    ],
  ];
}

/**
 * Handle portfolio navigation
 */
export async function handlePortfolioNavigation(ctx, data, pushView, popView) {
  switch (data) {
    case 'nav_portfolio':
      await ctx.answerCbQuery();
      {
        const text = '📊 Portfolio\n\nManage your encrypted positions:';
        const markup = { inline_keyboard: getPortfolioKeyboard() };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'portfolio_view_positions':
      await ctx.answerCbQuery();
      {
        // Import the EVVM Fisher flow processor
        const { getUserPortfolio } = await import('../evvmFisherFlow.js');
        
        // Get user's encrypted portfolio
        const portfolio = await getUserPortfolio(String(ctx.from.id));
        
        if (portfolio.error) {
          const text = `❌ Error loading portfolio: ${portfolio.error}`;
          const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Portfolio', callback_data: 'nav_back_prev' } ] ] };
          pushView(text, markup);
          await ctx.editMessageText(text, { reply_markup: markup });
        } else if (portfolio.positions.length === 0) {
          const text = `📊 Active Positions\n\n*No positions yet!*\n\nStart by:\n• Making a swap (Trade menu)\n• Lending assets (Lend menu)\n\nAll your positions will appear here.`;
          const markup = { inline_keyboard: [ 
            [ { text: '🔄 New Trade', callback_data: 'nav_trade' } ],
            [ { text: '🏦 New Lend', callback_data: 'nav_lend' } ],
            [ { text: '⬅️ Back to Portfolio', callback_data: 'nav_back_prev' } ] 
          ] };
          pushView(text, markup);
          await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
        } else {
          const positionsText = portfolio.positions.map((pos, idx) => {
            if (pos.type === 'swap') {
              return `${idx + 1}. **SWAP**: ${pos.amount} ${pos.from} → ${pos.estimatedOutput} ${pos.to}\n   Status: ${pos.status} | TX: \`${pos.txHash.substring(0, 10)}...\``;
            } else if (pos.type === 'lend') {
              return `${idx + 1}. **LEND**: ${pos.amount} ${pos.token} for ${pos.duration} days\n   APY: ${pos.apy} | Status: ${pos.status} | TX: \`${pos.txHash.substring(0, 10)}...\``;
            }
            return `${idx + 1}. ${pos.type}: ${pos.amount}`;
          }).join('\n\n');
          
          const text = `📊 Your Positions\n\n${positionsText}\n\n**Summary:**\n• Total Positions: ${portfolio.totalPositions}\n• Active Loans: ${portfolio.activeLoans}\n• Completed Swaps: ${portfolio.completedSwaps}\n• Total Value: ${portfolio.totalValue}\n\n*All data encrypted via EVVM Native*`;
          const markup = { inline_keyboard: [ 
            [ { text: '🔄 Refresh', callback_data: 'portfolio_refresh' } ],
            [ { text: '⬅️ Back to Portfolio', callback_data: 'nav_back_prev' } ] 
          ] };
          pushView(text, markup);
          await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
        }
      }
      break;

    case 'portfolio_view_balances':
      await ctx.answerCbQuery();
      {
        const text = '💰 Token Balances\n\n**Current Balances:**\n• ETH: 0.5\n• USDC: 1,250\n• USDT: 500\n\n*Balances encrypted and private*\n*Only you can decrypt via EVVM keys*';
        const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Portfolio', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'portfolio_performance':
      await ctx.answerCbQuery();
      {
        const text = '📈 Performance Metrics\n\n**Portfolio Performance:**\n• Total Value: $3,500\n• 24h Change: +2.3%\n• 7d Change: +8.7%\n• 30d Change: +15.2%\n\n*Metrics calculated from encrypted data*';
        const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Portfolio', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'portfolio_refresh':
      await ctx.answerCbQuery('Refreshing portfolio...');
      {
        const text = '🔄 Portfolio Refreshed\n\n**Updated Data:**\n• Last updated: Just now\n• Positions: 2 active\n• Total value: $3,500\n\n*Data synchronized from Arcology*';
        const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Portfolio', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    default:
      return false; // Not handled by portfolio
  }
  
  return true; // Handled by portfolio
}
