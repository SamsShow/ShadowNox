export function getTradeKeyboard() {
  return [
    [
      { text: '🔄 Quick Swap', callback_data: 'trade_quick_swap' },
      { text: '⚙️ Custom Swap', callback_data: 'trade_custom_swap' },
    ],
    [
      { text: '📊 View Rates', callback_data: 'trade_view_rates' },
      { text: '📈 Market Info', callback_data: 'trade_market_info' },
    ],
    [
      { text: '⬅️ Back to Dashboard', callback_data: 'nav_back_prev' },
    ],
  ];
}

/**
 * Generate quick swap options keyboard
 */
export function getQuickSwapKeyboard() {
  return [
    [
      { text: '1 ETH → USDC', callback_data: 'quick_swap_eth_usdc' },
      { text: '100 USDC → ETH', callback_data: 'quick_swap_usdc_eth' },
    ],
    [
      { text: 'X ETH → USDT', callback_data: 'quick_swap_eth_usdt_custom' },
      { text: 'X USDT → ETH', callback_data: 'quick_swap_usdt_eth_custom' },
    ],
    [
      { text: '⬅️ Back to Trade', callback_data: 'nav_back_prev' },
    ],
  ];
}

/**
 * Generate custom swap keyboard
 */
export function getCustomSwapKeyboard() {
  return [
    [
      { text: 'Enter Amount', callback_data: 'custom_swap_amount' },
    ],
    [
      { text: 'Select From Token', callback_data: 'custom_swap_from' },
      { text: 'Select To Token', callback_data: 'custom_swap_to' },
    ],
    [
      { text: '⬅️ Back to Trade', callback_data: 'nav_back_prev' },
    ],
  ];
}

/**
 * Handle trade navigation
 */
export async function handleTradeNavigation(ctx, data, pushView, popView, userStates) {
  const userId = String(ctx.from.id);
  
  switch (data) {
    case 'nav_trade':
      await ctx.answerCbQuery();
      {
        const text = '🔄 Trade\n\nChoose your trading option:';
        const markup = { inline_keyboard: getTradeKeyboard() };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'trade_quick_swap':
      await ctx.answerCbQuery();
      {
        const text = '🔄 Quick Swap\n\nSelect a predefined swap:';
        const markup = { inline_keyboard: getQuickSwapKeyboard() };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'trade_custom_swap':
      await ctx.answerCbQuery();
      {
        const text = '⚙️ Custom Swap\n\nConfigure your swap:';
        const markup = { inline_keyboard: getCustomSwapKeyboard() };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'trade_view_rates':
      await ctx.answerCbQuery();
      {
        const text = '📊 Current Rates\n\nETH/USD: $2,500\nUSDC/USD: $1.00\nUSDT/USD: $1.00\n\n*Note: Rates from Pyth Hermes*';
        const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Trade', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'trade_market_info':
      await ctx.answerCbQuery();
      {
        const text = '📈 Market Info\n\nEVVM TPS: 10k-15k\nEncryption: EVVM Native\nAsync Nonces: Enabled\n\n*Powered by EVVM Fisher Bots*';
        const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Trade', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    // Quick swap handlers
    case 'quick_swap_eth_usdc':
      await ctx.answerCbQuery('Processing swap...');
      {
        // Set user state for amount confirmation
        userStates.set(userId, { 
          action: 'confirm_swap', 
          swap: { from: 'ETH', to: 'USDC', amount: '1' },
          step: 'confirm'
        });
        
        const text = '🔄 Confirm Swap\n\n**Swap Details:**\nFrom: 1 ETH\nTo: ~2,500 USDC\n\n*Estimated rate: $2,500/ETH*\n\nProceed with this swap?';
        const markup = { 
          inline_keyboard: [
            [ { text: '✅ Confirm Swap', callback_data: 'confirm_swap_execute' } ],
            [ { text: '❌ Cancel', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'quick_swap_usdc_eth':
      await ctx.answerCbQuery('Processing swap...');
      {
        userStates.set(userId, { 
          action: 'confirm_swap', 
          swap: { from: 'USDC', to: 'ETH', amount: '100' },
          step: 'confirm'
        });
        
        const text = '🔄 Confirm Swap\n\n**Swap Details:**\nFrom: 100 USDC\nTo: ~0.04 ETH\n\n*Estimated rate: $2,500/ETH*\n\nProceed with this swap?';
        const markup = { 
          inline_keyboard: [
            [ { text: '✅ Confirm Swap', callback_data: 'confirm_swap_execute' } ],
            [ { text: '❌ Cancel', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'quick_swap_eth_usdt_custom':
      await ctx.answerCbQuery();
      {
        userStates.set(userId, { 
          action: 'custom_swap', 
          step: 'amount',
          swap: { from: 'ETH', to: 'USDT' }
        });
        
        const text = '💰 Enter ETH Amount\n\nPlease reply with the amount of ETH you want to swap to USDT:\n\n*Example: 1.5*';
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Quick Swap', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'quick_swap_usdt_eth_custom':
      await ctx.answerCbQuery();
      {
        userStates.set(userId, { 
          action: 'custom_swap', 
          step: 'amount',
          swap: { from: 'USDT', to: 'ETH' }
        });
        
        const text = '💰 Enter USDT Amount\n\nPlease reply with the amount of USDT you want to swap to ETH:\n\n*Example: 500*';
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Quick Swap', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    // Custom swap handlers
    case 'custom_swap_amount':
      await ctx.answerCbQuery();
      {
        userStates.set(userId, { 
          action: 'custom_swap', 
          step: 'amount',
          swap: {}
        });
        
        const text = '💰 Enter Amount\n\nPlease reply with the amount you want to swap:\n\n*Example: 1.5*';
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Custom Swap', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'custom_swap_from':
      await ctx.answerCbQuery();
      {
        const text = '🔄 Select From Token\n\nChoose the token you want to swap from:';
        const markup = { 
          inline_keyboard: [
            [ { text: 'ETH', callback_data: 'select_from_ETH' } ],
            [ { text: 'USDC', callback_data: 'select_from_USDC' } ],
            [ { text: 'USDT', callback_data: 'select_from_USDT' } ],
            [ { text: '⬅️ Back to Custom Swap', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'custom_swap_to':
      await ctx.answerCbQuery();
      {
        const text = '🔄 Select To Token\n\nChoose the token you want to swap to:';
        const markup = { 
          inline_keyboard: [
            [ { text: 'ETH', callback_data: 'select_to_ETH' } ],
            [ { text: 'USDC', callback_data: 'select_to_USDC' } ],
            [ { text: 'USDT', callback_data: 'select_to_USDT' } ],
            [ { text: '⬅️ Back to Custom Swap', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    // Token selection handlers
    case 'select_from_ETH':
    case 'select_from_USDC':
    case 'select_from_USDT':
      await ctx.answerCbQuery();
      {
        const token = data.split('_')[2];
        const state = userStates.get(userId) || {};
        state.swap = { ...state.swap, from: token };
        userStates.set(userId, state);
        
        const text = `✅ From Token Selected: ${token}\n\nContinue with token selection or go back.`;
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Custom Swap', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'select_to_ETH':
    case 'select_to_USDC':
    case 'select_to_USDT':
      await ctx.answerCbQuery();
      {
        const token = data.split('_')[2];
        const state = userStates.get(userId) || {};
        state.swap = { ...state.swap, to: token };
        userStates.set(userId, state);
        
        const text = `✅ To Token Selected: ${token}\n\nContinue with token selection or go back.`;
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Custom Swap', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'confirm_swap_execute':
      await ctx.answerCbQuery('Executing swap...');
      {
        const state = userStates.get(userId);
        const swap = state?.swap || {};
        
        // Import the EVVM Fisher flow processor
        const { processSwapIntent } = await import('../evvmFisherFlow.js');
        
        // Execute the complete EVVM Fisher flow
        const result = await processSwapIntent(userId, swap);
        
        const text = result.message;
        const markup = { 
          inline_keyboard: [
            [ { text: '🔄 New Trade', callback_data: 'nav_trade' } ],
            [ { text: '📊 View Portfolio', callback_data: 'nav_portfolio' } ],
            [ { text: '🏠 Dashboard', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
        
        // Clear user state
        userStates.delete(userId);
      }
      break;

    default:
      return false; // Not handled by trade
  }
  
  return true; // Handled by trade
}

/**
 * Handle text input for trade
 */
export async function handleTradeText(ctx, text, pushView, userStates) {
  const userId = String(ctx.from.id);
  const state = userStates.get(userId);
  
  if (!state || state.action !== 'custom_swap') {
    return false; // Not a trade text input
  }
  
  if (state.step === 'amount') {
    const amount = parseFloat(text);
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('❌ Invalid amount. Please enter a positive number.');
      return true;
    }
    
    // Update state with amount
    state.swap = { ...state.swap, amount: amount.toString() };
    state.step = 'complete';
    userStates.set(userId, state);
    
    const swap = state.swap;
    
    // Check if this is a quick custom swap (from/to already set)
    if (swap.from && swap.to) {
      // Calculate estimated output (mock calculation)
      const estimatedOutput = swap.from === 'ETH' ? (amount * 2500).toFixed(2) : (amount / 2500).toFixed(4);
      
      const text = `✅ Swap Confirmation\n\n**Swap Details:**\nFrom: ${amount} ${swap.from}\nTo: ~${estimatedOutput} ${swap.to}\n\n**Rate:** 1 ${swap.from} = ${swap.from === 'ETH' ? '2500' : '0.0004'} ${swap.to}\n\n*Intent will be submitted to EVVM Fisher Bot*`;
      const markup = { 
        inline_keyboard: [
          [ { text: '✅ Confirm Swap', callback_data: 'confirm_swap_execute' } ],
          [ { text: '❌ Cancel', callback_data: 'nav_back_prev' } ]
        ]
      };
      pushView(text, markup);
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: markup });
    } else {
      // Original custom swap flow
      const text = `✅ Amount Set: ${amount}\n\n**Custom Swap Summary:**\nAmount: ${swap.amount}\nFrom: ${swap.from || 'Not selected'}\nTo: ${swap.to || 'Not selected'}\n\nComplete your swap configuration.`;
      const markup = { 
        inline_keyboard: [
          [ { text: '⬅️ Back to Custom Swap', callback_data: 'nav_back_prev' } ]
        ]
      };
      pushView(text, markup);
      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: markup });
    }
    
    return true;
  }
  
  return false;
}
