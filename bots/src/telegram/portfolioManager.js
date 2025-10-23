/**
 * Portfolio Manager - Tracks user transactions and positions
 * Stores data in .user_portfolios.json
 */

import fs from 'fs';
import path from 'path';

const PORTFOLIO_FILE = path.resolve(process.cwd(), '.user_portfolios.json');

class PortfolioManager {
  constructor() {
    this.portfolios = this.loadPortfolios();
  }

  loadPortfolios() {
    try {
      if (fs.existsSync(PORTFOLIO_FILE)) {
        const data = fs.readFileSync(PORTFOLIO_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading portfolios:', error.message);
    }
    return {};
  }

  savePortfolios() {
    try {
      fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(this.portfolios, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving portfolios:', error.message);
    }
  }

  getUserPortfolio(userId) {
    if (!this.portfolios[userId]) {
      this.portfolios[userId] = {
        positions: [],
        transactions: [],
        createdAt: new Date().toISOString()
      };
      this.savePortfolios();
    }
    return this.portfolios[userId];
  }

  addTransaction(userId, transaction) {
    const portfolio = this.getUserPortfolio(userId);
    
    const tx = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...transaction
    };
    
    portfolio.transactions.push(tx);
    
    // Update positions based on transaction type
    if (transaction.type === 'swap') {
      this.updateSwapPosition(portfolio, tx);
    } else if (transaction.type === 'lend') {
      this.addLendPosition(portfolio, tx);
    } else if (transaction.type === 'borrow') {
      this.addBorrowPosition(portfolio, tx);
    }
    
    this.savePortfolios();
    return tx;
  }

  updateSwapPosition(portfolio, tx) {
    // Add swap to transaction history
    const position = {
      type: 'swap',
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      estimatedOutput: tx.estimatedOutput,
      txHash: tx.txHash,
      status: 'completed',
      timestamp: tx.timestamp
    };
    
    portfolio.positions.push(position);
  }

  addLendPosition(portfolio, tx) {
    const position = {
      type: 'lend',
      token: tx.token,
      amount: tx.amount,
      duration: tx.duration,
      apy: tx.apy || '5.2%',
      startDate: tx.timestamp,
      endDate: new Date(Date.now() + parseInt(tx.duration) * 24 * 60 * 60 * 1000).toISOString(),
      txHash: tx.txHash,
      status: 'active',
      timestamp: tx.timestamp
    };
    
    portfolio.positions.push(position);
  }

  addBorrowPosition(portfolio, tx) {
    const position = {
      type: 'borrow',
      token: tx.token,
      amount: tx.amount,
      collateral: tx.collateral,
      txHash: tx.txHash,
      status: 'active',
      timestamp: tx.timestamp
    };
    
    portfolio.positions.push(position);
  }

  getActivePositions(userId) {
    const portfolio = this.getUserPortfolio(userId);
    return portfolio.positions.filter(pos => pos.status === 'active');
  }

  getAllPositions(userId) {
    const portfolio = this.getUserPortfolio(userId);
    return portfolio.positions;
  }

  getTransactionHistory(userId, limit = 10) {
    const portfolio = this.getUserPortfolio(userId);
    return portfolio.transactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  getPortfolioSummary(userId) {
    const portfolio = this.getUserPortfolio(userId);
    const activePositions = this.getActivePositions(userId);
    
    // Calculate total value (simplified for demo)
    let totalValue = 0;
    activePositions.forEach(pos => {
      if (pos.type === 'lend') {
        totalValue += parseFloat(pos.amount) * (pos.token === 'ETH' ? 2500 : 1);
      }
    });
    
    return {
      totalPositions: activePositions.length,
      totalTransactions: portfolio.transactions.length,
      totalValue: totalValue.toFixed(2),
      activeLoans: activePositions.filter(p => p.type === 'lend').length,
      completedSwaps: portfolio.positions.filter(p => p.type === 'swap' && p.status === 'completed').length
    };
  }
}

// Singleton instance
export const portfolioManager = new PortfolioManager();
