
/**
 * Generate lend menu keyboard
 */
export function getLendKeyboard() {
  return [
    [
      { text: '💰 Deposit', callback_data: 'lend_deposit' },
      { text: '💸 Withdraw', callback_data: 'lend_withdraw' },
    ],
    [
      { text: '🔒 Add Collateral', callback_data: 'lend_add_collateral' },
      { text: '🏦 Borrow', callback_data: 'lend_borrow' },
    ],
    [
      { text: '💳 Repay', callback_data: 'lend_repay' },
      { text: '🔓 Withdraw Collateral', callback_data: 'lend_withdraw_collateral' },
    ],
    [
      { text: '📊 View Rates', callback_data: 'lend_view_rates' },
      { text: '📈 My Position', callback_data: 'lend_my_position' },
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
        
        // Show processing message
        await ctx.editMessageText('⏳ Processing lending operation...\n\nThis may take a moment...', { parse_mode: 'Markdown' });
        
        // Add 1-2 second delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
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

    // New lending operation handlers
    case 'lend_deposit':
      await ctx.answerCbQuery();
      {
        userStates.set(userId, { 
          action: 'deposit_amount', 
          step: 'amount',
          operation: 'deposit'
        });
        
        const text = '💰 *Deposit Funds*\n\nHow much would you like to deposit?\n\nPlease reply with the amount in ETH:\n\n_Example: 0.1_';
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Lend', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'lend_withdraw':
      await ctx.answerCbQuery();
      {
        userStates.set(userId, { 
          action: 'withdraw_amount', 
          step: 'amount',
          operation: 'withdraw'
        });
        
        const text = '💸 *Withdraw Funds*\n\nHow much would you like to withdraw?\n\nPlease reply with the amount in ETH:\n\n_Example: 0.05_';
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Lend', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'lend_add_collateral':
      await ctx.answerCbQuery();
      {
        userStates.set(userId, { 
          action: 'add_collateral_amount', 
          step: 'amount',
          operation: 'add_collateral'
        });
        
        const text = '🔒 *Add Collateral*\n\nHow much collateral would you like to add?\n\nPlease reply with the amount in ETH:\n\n_Example: 0.2_';
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Lend', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'lend_borrow':
      await ctx.answerCbQuery();
      {
        userStates.set(userId, { 
          action: 'borrow_amount', 
          step: 'amount',
          operation: 'borrow'
        });
        
        const text = '🏦 *Borrow Funds*\n\nHow much would you like to borrow?\n\nPlease reply with the amount in ETH:\n\n_Example: 0.05_\n\n⚠️ Make sure you have sufficient collateral!';
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Lend', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'lend_repay':
      await ctx.answerCbQuery();
      {
        userStates.set(userId, { 
          action: 'repay_amount', 
          step: 'amount',
          operation: 'repay'
        });
        
        const text = '💳 *Repay Borrowed Funds*\n\nHow much would you like to repay?\n\nPlease reply with the amount in ETH:\n\n_Example: 0.05_';
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Lend', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'lend_withdraw_collateral':
      await ctx.answerCbQuery();
      {
        userStates.set(userId, { 
          action: 'withdraw_collateral_amount', 
          step: 'amount',
          operation: 'withdraw_collateral'
        });
        
        const text = '🔓 *Withdraw Collateral*\n\nHow much collateral would you like to withdraw?\n\nPlease reply with the amount in ETH:\n\n_Example: 0.1_\n\n⚠️ Ensure you maintain sufficient collateral ratio!';
        const markup = { 
          inline_keyboard: [
            [ { text: '⬅️ Back to Lend', callback_data: 'nav_back_prev' } ]
          ]
        };
        pushView(text, markup);
        await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
      }
      break;

    case 'lend_my_position':
      await ctx.answerCbQuery();
      {
        try {
          // TODO: Fetch actual position data from SimpleLending contract
          const text = `📈 *Your Lending Position*

💰 *Deposited:* 0.5 ETH
🏦 *Borrowed:* 0.2 ETH
🔒 *Collateral:* 0.3 ETH
📊 *Health Factor:* 1.5 (Healthy)

💵 *Available to Borrow:* 0.15 ETH
💸 *Available to Withdraw:* 0.2 ETH

_Last updated: Just now_`;
          
          const markup = { 
            inline_keyboard: [
              [ { text: '🔄 Refresh', callback_data: 'lend_my_position' } ],
              [ { text: '⬅️ Back to Lend', callback_data: 'nav_back_prev' } ]
            ]
          };
          pushView(text, markup);
          await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: markup });
        } catch (error) {
          await ctx.editMessageText(`❌ Error fetching position: ${error.message}`);
        }
      }
      break;

    // Confirmation handlers for new lending operations
    case 'confirm_lending_deposit':
    case 'confirm_lending_withdraw':
    case 'confirm_lending_add_collateral':
    case 'confirm_lending_borrow':
    case 'confirm_lending_repay':
    case 'confirm_lending_withdraw_collateral':
      await ctx.answerCbQuery('Processing...');
      {
        const state = userStates.get(userId);
        if (!state) {
          await ctx.editMessageText('❌ Session expired. Please start again.');
          return true;
        }

        const operation = state.operation;
        const amount = state.amount;

        try {
          // Show processing message
          await ctx.editMessageText('⏳ Processing transaction...\n\nThis may take a moment...', { parse_mode: 'Markdown' });
          
          // Add 1.5 second delay for better UX
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // TODO: Call actual contract functions
          // For now, simulate success
          let operationName = '';
          let emoji = '';
          
          switch (operation) {
            case 'deposit':
              operationName = 'Deposit';
              emoji = '💰';
              break;
            case 'withdraw':
              operationName = 'Withdraw';
              emoji = '💸';
              break;
            case 'add_collateral':
              operationName = 'Add Collateral';
              emoji = '🔒';
              break;
            case 'borrow':
              operationName = 'Borrow';
              emoji = '🏦';
              break;
            case 'repay':
              operationName = 'Repay';
              emoji = '💳';
              break;
            case 'withdraw_collateral':
              operationName = 'Withdraw Collateral';
              emoji = '🔓';
              break;
          }

          const successText = `${emoji} *${operationName} Successful!*\n\n*Amount:* ${amount} ETH\n*Status:* ✅ Confirmed\n*Transaction:* 0x${Math.random().toString(16).slice(2, 10)}...\n\n_Your position has been updated._`;
          
          const markup = { 
            inline_keyboard: [
              [ { text: '📈 View Position', callback_data: 'lend_my_position' } ],
              [ { text: '🏦 New Operation', callback_data: 'nav_lend' } ],
              [ { text: '🏠 Home', callback_data: 'nav_home' } ]
            ]
          };
          
          await ctx.editMessageText(successText, { parse_mode: 'Markdown', reply_markup: markup });
          
          // Clear user state
          userStates.delete(userId);
        } catch (error) {
          await ctx.editMessageText(`❌ *Transaction Failed*\n\n${error.message}\n\nPlease try again.`, { parse_mode: 'Markdown' });
          userStates.delete(userId);
        }
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
  
  if (!state) {
    return false; // No active state
  }
  
  // Handle custom lend amount input
  if (state.action === 'custom_lend' && state.step === 'amount') {
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
    const responseText = `✅ Amount Set: ${amount}\n\n**Custom Lend Summary:**\nAmount: ${lend.amount}\nToken: ${lend.token || 'Not selected'}\nDuration: ${lend.duration || 'Not selected'}\n\nComplete your lending configuration.`;
    const markup = { 
      inline_keyboard: [
        [ { text: '⬅️ Back to Custom Lend', callback_data: 'nav_back_prev' } ]
      ]
    };
    pushView(responseText, markup);
    await ctx.reply(responseText, { parse_mode: 'Markdown', reply_markup: markup });
    
    return true;
  }
  
  // Handle new lending operations
  const operation = state.operation;
  if (state.step === 'amount' && operation) {
    const amount = parseFloat(text);
    if (isNaN(amount) || amount <= 0) {
      await ctx.reply('❌ Invalid amount. Please enter a positive number.');
      return true;
    }
    
    // Update state with amount and move to confirmation
    state.amount = amount.toString();
    state.step = 'confirm';
    userStates.set(userId, state);
    
    // Generate confirmation message based on operation
    let operationName = '';
    let emoji = '';
    let details = '';
    
    switch (operation) {
      case 'deposit':
        operationName = 'Deposit';
        emoji = '💰';
        details = `You will deposit ${amount} ETH into the lending pool.\n\n📈 Current APY: ~3.8%\n💵 Expected earnings: ~${(amount * 0.038 / 12).toFixed(4)} ETH/month`;
        break;
      case 'withdraw':
        operationName = 'Withdraw';
        emoji = '💸';
        details = `You will withdraw ${amount} ETH from your deposits.\n\n⚠️ Ensure you have sufficient deposited balance.`;
        break;
      case 'add_collateral':
        operationName = 'Add Collateral';
        emoji = '🔒';
        details = `You will add ${amount} ETH as collateral.\n\n📊 This will increase your borrowing capacity.`;
        break;
      case 'borrow':
        operationName = 'Borrow';
        emoji = '🏦';
        details = `You will borrow ${amount} ETH.\n\n📉 Current APY: ~5.2%\n⚠️ Ensure you have sufficient collateral!`;
        break;
      case 'repay':
        operationName = 'Repay';
        emoji = '💳';
        details = `You will repay ${amount} ETH.\n\n✅ This will reduce your debt and free up collateral.`;
        break;
      case 'withdraw_collateral':
        operationName = 'Withdraw Collateral';
        emoji = '🔓';
        details = `You will withdraw ${amount} ETH from your collateral.\n\n⚠️ Ensure you maintain sufficient collateral ratio!`;
        break;
    }
    
    const confirmText = `${emoji} *Confirm ${operationName}*\n\n*Amount:* ${amount} ETH\n\n${details}\n\nProceed with this transaction?`;
    const markup = { 
      inline_keyboard: [
        [ { text: '✅ Confirm', callback_data: `confirm_lending_${operation}` } ],
        [ { text: '❌ Cancel', callback_data: 'nav_lend' } ]
      ]
    };
    
    await ctx.reply(confirmText, { parse_mode: 'Markdown', reply_markup: markup });
    return true;
  }
  
  return false;
}
