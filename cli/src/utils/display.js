import chalk from 'chalk';
import { table } from 'table';

// Display banner
export function displayBanner() {
  console.clear();
  console.log(chalk.cyan(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║     ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ║
  ║     ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ║
  ║     ███████╗███████║███████║██║  ██║██║   ██║██║    ║
  ║     ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║    ║
  ║     ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝██║    ║
  ║     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝    ║
  ║                                                       ║
  ║            Shadow Economy CLI Tester                 ║
  ║         On-Chain Contract Testing Tool               ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `));
}

// Display success message
export function displaySuccess(message) {
  console.log(chalk.green(`\n✅ ${message}\n`));
}

// Display error message
export function displayError(message) {
  console.log(chalk.red(`\n❌ ${message}\n`));
}

// Display warning message
export function displayWarning(message) {
  console.log(chalk.yellow(`\n⚠️  ${message}\n`));
}

// Display info message
export function displayInfo(message) {
  console.log(chalk.blue(`\nℹ️  ${message}\n`));
}

// Display transaction hash
export function displayTxHash(hash) {
  console.log(chalk.cyan(`\n📝 Transaction Hash: ${hash}`));
}

// Display table
export function displayTable(data, config = {}) {
  const output = table(data, {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼'
    },
    ...config
  });
  console.log(output);
}

// Display section header
export function displaySection(title) {
  console.log(chalk.bold.cyan(`\n${'='.repeat(60)}`));
  console.log(chalk.bold.cyan(`  ${title}`));
  console.log(chalk.bold.cyan(`${'='.repeat(60)}\n`));
}

// Format amount for display
export function formatDisplayAmount(amount, symbol = 'ETH', decimals = 4) {
  const num = parseFloat(amount);
  return `${num.toFixed(decimals)} ${symbol}`;
}

// Format timestamp for display
export function formatTimestamp(timestamp) {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
}

// Format address for display
export function formatDisplayAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Display swap intent details
export function displaySwapIntent(intent, intentId) {
  displaySection('Swap Intent Details');
  
  const data = [
    [chalk.bold('Property'), chalk.bold('Value')],
    ['Intent ID', intentId],
    ['User', formatDisplayAddress(intent.user)],
    ['Timestamp', formatTimestamp(intent.timestamp)],
    ['Executed', intent.executed ? '✅ Yes' : '❌ No'],
    ['Cancelled', intent.cancelled ? '✅ Yes' : '❌ No'],
    ['Intent Data', `${intent.intentData.slice(0, 20)}...`]
  ];
  
  displayTable(data);
}

// Display lending account details
export function displayLendingAccount(account, userAddress) {
  displaySection('Lending Account Details');
  
  const data = [
    [chalk.bold('Property'), chalk.bold('Value')],
    ['User', formatDisplayAddress(userAddress)],
    ['Deposited', formatDisplayAmount(account.deposited)],
    ['Borrowed', formatDisplayAmount(account.borrowed)],
    ['Collateral', formatDisplayAmount(account.collateral)],
    ['Collateral Token', account.collateralToken === '0x0000000000000000000000000000000000000000' 
      ? 'None' 
      : formatDisplayAddress(account.collateralToken)],
    ['Last Update', formatTimestamp(account.lastUpdate)]
  ];
  
  displayTable(data);
}

// Display statistics
export function displayStats(stats, title = 'Statistics') {
  displaySection(title);
  
  const data = [
    [chalk.bold('Metric'), chalk.bold('Value')],
    ...Object.entries(stats).map(([key, value]) => [key, value])
  ];
  
  displayTable(data);
}

// Display loading spinner text
export function loadingText(text) {
  return chalk.yellow(`⏳ ${text}...`);
}

// Display network info
export function displayNetworkInfo(info) {
  displaySection('Network Information');
  
  const data = [
    [chalk.bold('Property'), chalk.bold('Value')],
    ['Network', info.network],
    ['Chain ID', info.chainId],
    ['RPC URL', info.rpcUrl],
    ['Block Number', info.blockNumber]
  ];
  
  displayTable(data);
}

// Display wallet info
export function displayWalletInfo(info) {
  displaySection('Wallet Information');
  
  const data = [
    [chalk.bold('Property'), chalk.bold('Value')],
    ['Address', info.address],
    ['Balance', formatDisplayAmount(info.balance)],
    ['Nonce', info.nonce]
  ];
  
  displayTable(data);
}

// Display contract addresses
export function displayContractAddresses(contracts) {
  displaySection('Contract Addresses');
  
  const data = [
    [chalk.bold('Contract'), chalk.bold('Address')],
    ...Object.entries(contracts).map(([name, address]) => [name, address])
  ];
  
  displayTable(data);
}
