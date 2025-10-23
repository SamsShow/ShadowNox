/**
 * Arcology Benchmark Executor
 * 
 * Executes transaction batches on Arcology and measures performance
 * 
 * Metrics tracked:
 * - TPS (transactions per second)
 * - Conflict rate
 * - Gas consumption
 * - Execution time
 * - Confirmation time
 * 
 * Target: 10,000-15,000 TPS
 */

import { ethers } from 'ethers';
import fs from 'fs';
import { getArcologyProvider, getArcologyWallet } from './connector.js';

/**
 * Benchmark Executor for Arcology transactions
 */
export class BenchmarkExecutor {
  constructor(config = {}) {
    this.config = {
      batchSubmissionDelay: config.batchSubmissionDelay || 0, // ms between batches
      confirmationTimeout: config.confirmationTimeout || 30000, // 30s
      verbose: config.verbose || false,
      ...config
    };
    
    this.results = {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalGasUsed: 0n,
      totalDuration: 0,
      conflicts: 0,
      retries: 0,
      tps: 0
    };
    
    this.txReceipts = [];
  }

  /**
   * Execute a batch of transactions in parallel
   * 
   * @param {Array<Object>} batch - Transaction batch from generator
   * @param {Object} contractInstances - Contract instances keyed by type
   * @returns {Promise<Object>} Execution results
   */
  async executeParallelBatch(batch, contractInstances) {
    console.log(`\n📊 Executing parallel batch: ${batch.length} transactions`);
    console.log(`⏱️  Target: Submit all within 1 second for max parallelism\n`);
    
    const startTime = Date.now();
    const txPromises = [];
    
    // Submit all transactions as fast as possible
    for (const tx of batch) {
      const promise = this.submitTransaction(tx, contractInstances)
        .catch(error => ({
          txId: tx.id,
          error: error.message,
          failed: true
        }));
      
      txPromises.push(promise);
    }
    
    // Wait for all submissions
    const submissionResults = await Promise.allSettled(txPromises);
    const submissionTime = Date.now() - startTime;
    
    console.log(`✅ All transactions submitted in ${submissionTime}ms`);
    console.log(`📈 Submission rate: ${(batch.length / (submissionTime / 1000)).toFixed(2)} tx/s\n`);
    
    // Extract transaction hashes
    const pendingTxs = submissionResults
      .filter(result => result.status === 'fulfilled' && result.value && !result.value.failed)
      .map(result => result.value);
    
    console.log(`⏳ Waiting for ${pendingTxs.length} confirmations...`);
    
    // Wait for all confirmations
    const confirmationStart = Date.now();
    const confirmationResults = await this.waitForConfirmations(pendingTxs);
    const confirmationTime = Date.now() - confirmationStart;
    
    const totalTime = Date.now() - startTime;
    
    // Calculate metrics
    const metrics = this.calculateMetrics(
      batch,
      pendingTxs,
      confirmationResults,
      submissionTime,
      confirmationTime,
      totalTime
    );
    
    return metrics;
  }

  /**
   * Execute a batch sequentially (for comparison)
   * 
   * @param {Array<Object>} batch - Transaction batch
   * @param {Object} contractInstances - Contract instances
   * @returns {Promise<Object>} Execution results
   */
  async executeSequentialBatch(batch, contractInstances) {
    console.log(`\n📊 Executing sequential batch: ${batch.length} transactions`);
    console.log(`⏱️  Each transaction waits for previous confirmation\n`);
    
    const startTime = Date.now();
    const results = [];
    
    for (let i = 0; i < batch.length; i++) {
      const tx = batch[i];
      
      try {
        // Submit and wait
        const result = await this.submitTransaction(tx, contractInstances);
        if (result && result.hash) {
          const receipt = await result.wait();
          results.push(receipt);
          
          if (this.config.verbose && i % 10 === 0) {
            console.log(`Progress: ${i + 1}/${batch.length} transactions confirmed`);
          }
        }
      } catch (error) {
        console.error(`Transaction ${tx.id} failed:`, error.message);
        results.push({ failed: true, error: error.message });
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    // Calculate metrics
    const metrics = this.calculateMetrics(
      batch,
      results.filter(r => !r.failed),
      results,
      totalTime,
      0,
      totalTime
    );
    
    return metrics;
  }

  /**
   * Submit a single transaction to Arcology
   * 
   * @param {Object} tx - Transaction object from batch
   * @param {Object} contractInstances - Contract instances
   * @returns {Promise<Object>} Transaction response
   */
  async submitTransaction(tx, contractInstances) {
    const contract = this.getContractForTransaction(tx, contractInstances);
    
    if (!contract) {
      throw new Error(`No contract instance for transaction type: ${tx.type}`);
    }
    
    // Build transaction based on type
    let txResponse;
    
    switch (tx.type) {
      case 'swapIntent':
        txResponse = await contract.createSwapIntent(
          tx.params.tokenIn,
          tx.params.tokenOut,
          tx.params.amountIn,
          tx.params.minAmountOut,
          tx.params.deadline
        );
        break;
      
      case 'asyncNonce':
        txResponse = await contract.submitAsyncTransaction(
          tx.params.nonce,
          tx.params.data
        );
        break;
      
      case 'lendingDeposit':
        txResponse = await contract.deposit(
          tx.params.token,
          tx.params.amount
        );
        break;
      
      case 'vaultDeposit':
        txResponse = await contract.depositToVault(
          tx.params.amount,
          tx.params.lockPeriod
        );
        break;
      
      default:
        throw new Error(`Unsupported transaction type: ${tx.type}`);
    }
    
    return {
      txId: tx.id,
      hash: txResponse.hash,
      timestamp: Date.now(),
      ...txResponse
    };
  }

  /**
   * Wait for multiple transaction confirmations
   * 
   * @param {Array<Object>} pendingTxs - Array of pending transactions
   * @returns {Promise<Array>} Array of receipts
   */
  async waitForConfirmations(pendingTxs) {
    const provider = getArcologyProvider();
    
    const confirmationPromises = pendingTxs.map(async (tx) => {
      try {
        const receipt = await provider.waitForTransaction(
          tx.hash,
          1, // confirmations
          this.config.confirmationTimeout
        );
        return receipt;
      } catch (error) {
        console.error(`Confirmation failed for ${tx.hash}:`, error.message);
        return { failed: true, txHash: tx.hash, error: error.message };
      }
    });
    
    return await Promise.all(confirmationPromises);
  }

  /**
   * Calculate benchmark metrics
   * 
   * @param {Array} batch - Original batch
   * @param {Array} pendingTxs - Submitted transactions
   * @param {Array} receipts - Confirmed receipts
   * @param {number} submissionTime - Time to submit all txs
   * @param {number} confirmationTime - Time to confirm all txs
   * @param {number} totalTime - Total execution time
   * @returns {Object} Metrics
   */
  calculateMetrics(batch, pendingTxs, receipts, submissionTime, confirmationTime, totalTime) {
    const successfulReceipts = receipts.filter(r => r && !r.failed && r.status === 1);
    const failedReceipts = receipts.filter(r => !r || r.failed || r.status === 0);
    
    const totalGasUsed = successfulReceipts.reduce(
      (sum, receipt) => sum + (receipt.gasUsed || 0n),
      0n
    );
    
    const avgGasPerTx = successfulReceipts.length > 0
      ? totalGasUsed / BigInt(successfulReceipts.length)
      : 0n;
    
    const tps = totalTime > 0 
      ? (successfulReceipts.length / (totalTime / 1000)).toFixed(2)
      : 0;
    
    const metrics = {
      batchSize: batch.length,
      submitted: pendingTxs.length,
      successful: successfulReceipts.length,
      failed: failedReceipts.length,
      
      timing: {
        submissionTime: `${submissionTime}ms`,
        confirmationTime: `${confirmationTime}ms`,
        totalTime: `${totalTime}ms`,
        avgTimePerTx: `${(totalTime / batch.length).toFixed(2)}ms`
      },
      
      performance: {
        tps: parseFloat(tps),
        targetTps: '10,000-15,000',
        reachedTarget: parseFloat(tps) >= 10000
      },
      
      gas: {
        totalGasUsed: totalGasUsed.toString(),
        avgGasPerTx: avgGasPerTx.toString(),
        estimatedCost: 'Low (Arcology 100x cheaper than Ethereum)'
      },
      
      conflicts: {
        detected: 0, // TODO: Extract from events
        retries: 0,
        rate: '0%'
      }
    };
    
    return metrics;
  }

  /**
   * Get contract instance for transaction type
   * 
   * @param {Object} tx - Transaction object
   * @param {Object} contractInstances - Available contracts
   * @returns {Object} Contract instance
   */
  getContractForTransaction(tx, contractInstances) {
    const typeToContract = {
      'swapIntent': 'encryptedSwap',
      'settleSwap': 'encryptedSwap',
      'asyncNonce': 'asyncNonceEngine',
      'lendingDeposit': 'simpleLending',
      'lendingBorrow': 'simpleLending',
      'vaultDeposit': 'shadowVault',
      'vaultWithdraw': 'shadowVault'
    };
    
    const contractKey = typeToContract[tx.type];
    return contractInstances[contractKey];
  }

  /**
   * Print benchmark results
   * 
   * @param {Object} metrics - Benchmark metrics
   */
  printResults(metrics) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 ARCOLOGY BENCHMARK RESULTS');
    console.log('='.repeat(80));
    console.log('');
    
    console.log('📈 Transaction Summary:');
    console.log(`   Batch Size:        ${metrics.batchSize}`);
    console.log(`   Submitted:         ${metrics.submitted}`);
    console.log(`   Successful:        ${metrics.successful}`);
    console.log(`   Failed:            ${metrics.failed}`);
    console.log('');
    
    console.log('⏱️  Timing:');
    console.log(`   Submission Time:   ${metrics.timing.submissionTime}`);
    console.log(`   Confirmation Time: ${metrics.timing.confirmationTime}`);
    console.log(`   Total Time:        ${metrics.timing.totalTime}`);
    console.log(`   Avg Time per Tx:   ${metrics.timing.avgTimePerTx}`);
    console.log('');
    
    console.log('🚀 Performance:');
    console.log(`   Achieved TPS:      ${metrics.performance.tps.toFixed(2)}`);
    console.log(`   Target TPS:        ${metrics.performance.targetTps}`);
    console.log(`   Target Reached:    ${metrics.performance.reachedTarget ? '✅ YES' : '❌ NO'}`);
    console.log('');
    
    console.log('⛽ Gas Metrics:');
    console.log(`   Total Gas Used:    ${metrics.gas.totalGasUsed}`);
    console.log(`   Avg Gas per Tx:    ${metrics.gas.avgGasPerTx}`);
    console.log(`   Cost Estimate:     ${metrics.gas.estimatedCost}`);
    console.log('');
    
    console.log('⚠️  Conflicts:');
    console.log(`   Detected:          ${metrics.conflicts.detected}`);
    console.log(`   Retries:           ${metrics.conflicts.retries}`);
    console.log(`   Conflict Rate:     ${metrics.conflicts.rate}`);
    console.log('');
    
    console.log('='.repeat(80));
    console.log('');
  }

  /**
   * Compare parallel vs sequential execution
   * 
   * @param {Object} parallelMetrics - Parallel execution metrics
   * @param {Object} sequentialMetrics - Sequential execution metrics
   */
  compareResults(parallelMetrics, sequentialMetrics) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PARALLEL vs SEQUENTIAL COMPARISON');
    console.log('='.repeat(80));
    console.log('');
    
    const speedup = (sequentialMetrics.performance.tps / parallelMetrics.performance.tps).toFixed(2);
    
    console.log('🚀 Performance Comparison:');
    console.log(`   Parallel TPS:      ${parallelMetrics.performance.tps.toFixed(2)}`);
    console.log(`   Sequential TPS:    ${sequentialMetrics.performance.tps.toFixed(2)}`);
    console.log(`   Speedup:           ${speedup}x`);
    console.log('');
    
    console.log('⏱️  Time Comparison:');
    console.log(`   Parallel Total:    ${parallelMetrics.timing.totalTime}`);
    console.log(`   Sequential Total:  ${sequentialMetrics.timing.totalTime}`);
    console.log('');
    
    console.log('='.repeat(80));
    console.log('');
  }

  /**
   * Export results to JSON
   * 
   * @param {Object} metrics - Benchmark metrics
   * @param {string} filePath - Output file path
   */
  exportResults(metrics, filePath) {
    const output = {
      timestamp: new Date().toISOString(),
      metrics,
      arcologyVersion: 'testnet',
      targetTPS: '10,000-15,000'
    };
    
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
    console.log(`✅ Results exported to ${filePath}`);
  }
}

export default BenchmarkExecutor;
