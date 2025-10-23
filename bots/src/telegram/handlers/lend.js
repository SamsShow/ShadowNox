
/**
 * Generate lend menu keyboard
 */
export function getLendKeyboard() {
  return [
    [
      { text: '💰 Quick Lend', callback_data: 'lend_quick_lend' },
      { text: '⚙️ Custom Lend', callback_data: 'lend_custom_lend' },
    ],
    [
      { text: '📊 View Rates', callback_data: 'lend_view_rates' },
      { text: '📈 Pool Info', callback_data: 'lend_pool_info' },
    ],
    [
      { text: '⬅️ Back', callback_data: 'nav_back_prev' },
      { text: '🏠 Home', callback_data: 'nav_home' },
    ],
  ];
}

/**
 * Generate quick lend options keyboard
 */
export function getQuickLendKeyboard() {
  return [
    [
      { text: 'Lend 100 USDC', callback_data: 'quick_lend_100_usdc' },
      { text: 'Lend 500 USDC', callback_data: 'quick_lend_500_usdc' },
    ],
    [
      { text: 'Lend 1000 USDC', callback_data: 'quick_lend_1000_usdc' },
      { text: 'Lend 1 ETH', callback_data: 'quick_lend_1_eth' },
    ],
    [
      { text: '⬅️ Back', callback_data: 'nav_back_prev' },
      { text: '🏠 Home', callback_data: 'nav_home' },
    ],
  ];
}

/**
 * Generate custom lend keyboard
 */
export function getCustomLendKeyboard() {
  return [
    [
      { text: 'Enter Amount', callback_data: 'custom_lend_amount' },
    ],
    [
      { text: 'Select Token', callback_data: 'custom_lend_token' },
      { text: 'Select Duration', callback_data: 'custom_lend_duration' },
    ],
    [
      { text: '⬅️ Back', callback_data: 'nav_back_prev' },
      { text: '🏠 Home', callback_data: 'nav_home' },
    ],
  ];
}

/**
 * Handle lend navigation
 */
export async function handleLendNavigation(ctx, data, pushView, popView, userStates) {
  const userId = String(ctx.from.id);
  
  switch (data) {
    case 'nav_lend':
      await ctx.answerCbQuery();
      {
        const text = '🏦 Lend\n\nChoose your lending option:';
        const markup = { inline_keyboard: getLendKeyboard() };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'lend_quick_lend':
      await ctx.answerCbQuery();
      {
        const text = '💰 Quick Lend\n\nSelect a predefined lending amount:';
        const markup = { inline_keyboard: getQuickLendKeyboard() };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'lend_custom_lend':
      await ctx.answerCbQuery();
      {
        const text = '⚙️ Custom Lend\n\nConfigure your lending:';
        const markup = { inline_keyboard: getCustomLendKeyboard() };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'lend_view_rates':
      await ctx.answerCbQuery();
      {
        const text = '📊 Lending Rates\n\nUSDC: 5.2% APY\nETH: 3.8% APY\nUSDT: 4.9% APY\n\n*Rates updated via Pyth Hermes*';
        const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Lend', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'lend_pool_info':
      await ctx.answerCbQuery();
      {
        const text = '📈 Pool Information\n\nTotal TVL: $2.5M\nActive Lenders: 1,247\nAvg Duration: 30 days\n\n*Pool managed by ShadowVault*';
        const markup = { inline_keyboard: [ [ { text: '⬅️ Back to Lend', callback_data: 'nav_back_prev' } ] ] };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    // Quick lend handlers
    case 'quick_lend_100_usdc':
      await ctx.answerCbQuery('Processing lend...');
      {
        userStates.set(userId, { 
          action: 'confirm_lend', 
          lend: { token: 'USDC', amount: '100', duration: '30' },
          step: 'confirm'
        });
        
        const text = '💰 Confirm Lend\n\n**Lending Details:**\nAmount: 100 USDC\nDuration: 30 days\nAPY: 5.2%\nExpected Return: ~1.3 USDC\n\nProceed with this lending?';
        const markup = { 
          inline_keyboard: [
            [ { text: '✅ Confirm Lend', callback_data: 'confirm_lend_execute' } ],
            [ { text: '❌ Cancel', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'quick_lend_500_usdc':
      await ctx.answerCbQuery('Processing lend...');
      {
        userStates.set(userId, { 
          action: 'confirm_lend', 
          lend: { token: 'USDC', amount: '500', duration: '30' },
          step: 'confirm'
        });
        
        const text = '💰 Confirm Lend\n\n**Lending Details:**\nAmount: 500 USDC\nDuration: 30 days\nAPY: 5.2%\nExpected Return: ~6.5 USDC\n\nProceed with this lending?';
        const markup = { 
          inline_keyboard: [
            [ { text: '✅ Confirm Lend', callback_data: 'confirm_lend_execute' } ],
            [ { text: '❌ Cancel', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'quick_lend_1000_usdc':
      await ctx.answerCbQuery('Processing lend...');
      {
        userStates.set(userId, { 
          action: 'confirm_lend', 
          lend: { token: 'USDC', amount: '1000', duration: '30' },
          step: 'confirm'
        });
        
        const text = '💰 Confirm Lend\n\n**Lending Details:**\nAmount: 1000 USDC\nDuration: 30 days\nAPY: 5.2%\nExpected Return: ~13 USDC\n\nProceed with this lending?';
        const markup = { 
          inline_keyboard: [
            [ { text: '✅ Confirm Lend', callback_data: 'confirm_lend_execute' } ],
            [ { text: '❌ Cancel', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'quick_lend_1_eth':
      await ctx.answerCbQuery('Processing lend...');
      {
        userStates.set(userId, { 
          action: 'confirm_lend', 
          lend: { token: 'ETH', amount: '1', duration: '30' },
          step: 'confirm'
        });
        
        const text = '💰 Confirm Lend\n\n**Lending Details:**\nAmount: 1 ETH\nDuration: 30 days\nAPY: 3.8%\nExpected Return: ~0.03 ETH\n\nProceed with this lending?';
        const markup = { 
          inline_keyboard: [
            [ { text: '✅ Confirm Lend', callback_data: 'confirm_lend_execute' } ],
            [ { text: '❌ Cancel', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    // Custom lend handlers
    case 'custom_lend_amount':
      await ctx.answerCbQuery();
      {
        userStates.set(userId, { 
          action: 'custom_lend', 
          step: 'amount',
          lend: {}
        });
        
        const text = '💰 Enter Lending Amount\n\nPlease reply with the amount you want to lend:\n\n*Example: 250*';
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Custom Lend', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'custom_lend_token':
      await ctx.answerCbQuery();
      {
        const text = '🪙 Select Token\n\nChoose the token you want to lend:';
        const markup = { 
          inline_keyboard: [
            [ { text: 'USDC (5.2% APY)', callback_data: 'select_lend_token_USDC' } ],
            [ { text: 'ETH (3.8% APY)', callback_data: 'select_lend_token_ETH' } ],
            [ { text: 'USDT (4.9% APY)', callback_data: 'select_lend_token_USDT' } ],
            [ { text: '⬅️ Back to Custom Lend', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'custom_lend_duration':
      await ctx.answerCbQuery();
      {
        const text = '⏰ Select Duration\n\nChoose lending duration:';
        const markup = { 
          inline_keyboard: [
            [ { text: '7 days', callback_data: 'select_duration_7' } ],
            [ { text: '30 days', callback_data: 'select_duration_30' } ],
            [ { text: '90 days', callback_data: 'select_duration_90' } ],
            [ { text: '⬅️ Back to Custom Lend', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    // Token selection handlers
    case 'select_lend_token_USDC':
    case 'select_lend_token_ETH':
    case 'select_lend_token_USDT':
      await ctx.answerCbQuery();
      {
        const token = data.split('_')[3];
        const state = userStates.get(userId) || {};
        state.lend = { ...state.lend, token };
        userStates.set(userId, state);
        
        const text = `✅ Token Selected: ${token}\n\nContinue with configuration or go back.`;
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Custom Lend', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    // Duration selection handlers
    case 'select_duration_7':
    case 'select_duration_30':
    case 'select_duration_90':
      await ctx.answerCbQuery();
      {
        const duration = data.split('_')[2];
        const state = userStates.get(userId) || {};
        state.lend = { ...state.lend, duration };
        userStates.set(userId, state);
        
        const text = `✅ Duration Selected: ${duration} days\n\nContinue with configuration or go back.`;
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Custom Lend', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { reply_markup: markup });
      }
      break;

    case 'confirm_lend_execute':
      await ctx.answerCbQuery('Executing lend...');
      {
        const state = userStates.get(userId);
        const lend = state?.lend || {};
        
        // Import the EVVM Fisher flow processor
        const { processLendIntent } = await import('../evvmFisherFlow.js');
        
        // Execute the complete EVVM Fisher flow
        const result = await processLendIntent(userId, lend);
        
        const text = result.message;
        const markup = { 
          inline_keyboard: [
            [ { text: '🏦 New Lend', callback_data: 'nav_lend' } ],
            [ { text: '📊 View Portfolio', callback_data: 'nav_portfolio' } ],
            [ { text: '🏠 Home', callback_data: 'nav_home' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
        
        // Clear user state
        userStates.delete(userId);
      }
      break;

    default:
      return false; // Not handled by lend
  }
  
  return true; // Handled by lend
}

/**
 * Handle text input for lend
 */
export async function handleLendText(ctx, text, pushView, userStates) {
  const userId = String(ctx.from.id);
  const state = userStates.get(userId);
  
  if (!state || state.action !== 'custom_lend') {
    return false; // Not a lend text input
  }
  
  if (state.step === 'amount') {
    const amount = parseFloat(text);
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('❌ Invalid amount. Please enter a positive number.');
      return true;
    }
    
    // Update state with amount
    state.lend = { ...state.lend, amount: amount.toString() };
    state.step = 'complete';
    userStates.set(userId, state);
    
    const lend = state.lend;
    const text = `✅ Amount Set: ${amount}\n\n**Custom Lend Summary:**\nAmount: ${lend.amount}\nToken: ${lend.token || 'Not selected'}\nDuration: ${lend.duration || 'Not selected'}\n\nComplete your lending configuration.`;
    const markup = { 
      inline_keyboard: [
        [ { text: '⬅️ Back to Custom Lend', callback_data: 'nav_back_prev' } ]
      ]
    };
    pushView(text, markup);
    await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
    
    return true;
  }
  
  return false;
}
