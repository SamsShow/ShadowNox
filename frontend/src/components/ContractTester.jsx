import { useState } from 'react';
import { ethers } from 'ethers';
import { getContractAddresses, CONTRACT_ABIS } from '../config/contracts';

const ContractTester = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);
  const [contracts, setContracts] = useState({});
  const [activeTab, setActiveTab] = useState('atomicCounter');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);

      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(currentChainId);

      // Get contract addresses for current network
      const addresses = getContractAddresses(currentChainId);

      // Initialize contracts
      const contractInstances = {};
      for (const [name, address] of Object.entries(addresses)) {
        if (address && address !== '0x...') {
          contractInstances[name] = new ethers.Contract(address, CONTRACT_ABIS[name], signer);
        }
      }
      setContracts(contractInstances);

      setResult(`✅ Wallet connected successfully!
Network: Chain ID ${currentChainId}
Account: ${accounts[0]}
Contracts loaded: ${Object.keys(contractInstances).length}`);
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
  };

  // AtomicCounter Tests
  const testAtomicCounter = async (action, value) => {
    setLoading(true);
    try {
      let tx, receipt;
      switch (action) {
        case 'increment':
          tx = await contracts.atomicCounter.increment(ethers.parseEther(value));
          receipt = await tx.wait();
          setResult(`✅ Incremented by ${value}. Tx: ${receipt.hash}`);
          break;
        case 'decrement':
          tx = await contracts.atomicCounter.decrement(ethers.parseEther(value));
          receipt = await tx.wait();
          setResult(`✅ Decremented by ${value}. Tx: ${receipt.hash}`);
          break;
        case 'current':
          const current = await contracts.atomicCounter.current();
          setResult(`📊 Current value: ${ethers.formatEther(current)}`);
          break;
        case 'reset':
          tx = await contracts.atomicCounter.reset();
          receipt = await tx.wait();
          setResult(`✅ Counter reset. Tx: ${receipt.hash}`);
          break;
      }
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  // EncryptedSwap Tests
  const testEncryptedSwap = async (action, data) => {
    setLoading(true);
    try {
      let tx, receipt;
      switch (action) {
        case 'submitIntent':
          const encryptedData = ethers.toUtf8Bytes(data.intent || 'test_intent');
          tx = await contracts.encryptedSwap.submitSwapIntent(encryptedData, data.nonce || 1);
          receipt = await tx.wait();
          const event = receipt.logs.find(log => {
            try {
              return contracts.encryptedSwap.interface.parseLog(log).name === 'SwapIntentSubmitted';
            } catch { return false; }
          });
          setResult(`✅ Intent submitted. Tx: ${receipt.hash}`);
          break;
        case 'getMetrics':
          const metrics = await contracts.encryptedSwap.getAggregateMetrics();
          setResult(`📊 Volume: ${ethers.formatEther(metrics[0])}, Count: ${metrics[1].toString()}`);
          break;
      }
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  // FisherRewards Tests
  const testFisherRewards = async (action) => {
    setLoading(true);
    try {
      let tx, receipt;
      switch (action) {
        case 'register':
          tx = await contracts.fisherRewards.registerFisher();
          receipt = await tx.wait();
          setResult(`✅ Registered as Fisher. Tx: ${receipt.hash}`);
          break;
        case 'getStats':
          const stats = await contracts.fisherRewards.getRewardStats(account);
          setResult(`📊 Fisher Stats:
            Total Rewards: ${ethers.formatEther(stats.totalRewards)}
            Pending: ${ethers.formatEther(stats.pendingRewards)}
            Claimed: ${ethers.formatEther(stats.claimedRewards)}
            Tx Count: ${stats.transactionCount.toString()}
            Active: ${stats.isActive}`);
          break;
        case 'claim':
          tx = await contracts.fisherRewards.claimRewards();
          receipt = await tx.wait();
          setResult(`✅ Rewards claimed! Tx: ${receipt.hash}`);
          break;
        case 'getPool':
          const pool = await contracts.fisherRewards.getPoolStats();
          setResult(`📊 Pool Balance: ${ethers.formatEther(pool[0])}, Total Paid: ${ethers.formatEther(pool[1])}`);
          break;
        case 'fund':
          tx = await contracts.fisherRewards.fundRewardPool({ value: ethers.parseEther('1') });
          receipt = await tx.wait();
          setResult(`✅ Pool funded with 1 ETH. Tx: ${receipt.hash}`);
          break;
      }
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  // AsyncNonceEngine Tests
  const testAsyncNonce = async (action, data) => {
    setLoading(true);
    try {
      let tx, receipt;
      switch (action) {
        case 'getPending':
          const pending = await contracts.asyncNonceEngine.getPendingNonces(account);
          setResult(`📊 Pending Nonces: ${pending.map(n => n.toString()).join(', ') || 'None'}`);
          break;
        case 'hasPending':
          const hasPending = await contracts.asyncNonceEngine.hasPendingAsync(account);
          setResult(`📊 Has Pending: ${hasPending}`);
          break;
        case 'settle':
          tx = await contracts.asyncNonceEngine.settleAsync(data.nonce || 1);
          receipt = await tx.wait();
          setResult(`✅ Nonce ${data.nonce} settled. Tx: ${receipt.hash}`);
          break;
      }
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  // ShadowVault Tests
  const testShadowVault = async (action, data) => {
    setLoading(true);
    try {
      let tx, receipt;
      switch (action) {
        case 'create':
          const encData = ethers.toUtf8Bytes(data.data || 'encrypted_position_data');
          tx = await contracts.shadowVault.createPosition(encData);
          receipt = await tx.wait();
          setResult(`✅ Position created. Tx: ${receipt.hash}`);
          break;
        case 'getCount':
          const count = await contracts.shadowVault.getPositionCount(account);
          setResult(`📊 Your positions: ${count.toString()}`);
          break;
        case 'getPosition':
          const pos = await contracts.shadowVault.getPosition(account, data.id || 0);
          setResult(`📊 Position ${data.id}:
            Data: ${ethers.toUtf8String(pos.encryptedData)}
            Timestamp: ${new Date(Number(pos.timestamp) * 1000).toLocaleString()}
            Active: ${pos.active}`);
          break;
      }
    } catch (error) {
      setResult(`❌ Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Arcology Contract Tester
          </h1>
          <p className="text-gray-400">Test all Shadow Economy smart contracts on Arcology</p>
        </div>

        {/* Wallet Connection */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold mb-2">Wallet Connection</h2>
              {account ? (
                <p className="text-green-400">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
              ) : (
                <p className="text-gray-400">Not connected</p>
              )}
            </div>
            <button
              onClick={connectWallet}
              disabled={!!account}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
            >
              {account ? '✅ Connected' : 'Connect Wallet'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 rounded-lg p-2 mb-6 flex flex-wrap gap-2">
          {[
            { id: 'atomicCounter', name: 'AtomicCounter' },
            { id: 'encryptedSwap', name: 'EncryptedSwap' },
            { id: 'fisherRewards', name: 'FisherRewards' },
            { id: 'asyncNonce', name: 'AsyncNonce' },
            { id: 'shadowVault', name: 'ShadowVault' },
            { id: 'pythAdapter', name: 'PythAdapter' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Test Interface */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          {!account && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-400">Please connect your wallet to test contracts</p>
            </div>
          )}

          {account && activeTab === 'atomicCounter' && (
            <AtomicCounterTests onTest={testAtomicCounter} loading={loading} />
          )}

          {account && activeTab === 'encryptedSwap' && (
            <EncryptedSwapTests onTest={testEncryptedSwap} loading={loading} />
          )}

          {account && activeTab === 'fisherRewards' && (
            <FisherRewardsTests onTest={testFisherRewards} loading={loading} />
          )}

          {account && activeTab === 'asyncNonce' && (
            <AsyncNonceTests onTest={testAsyncNonce} loading={loading} />
          )}

          {account && activeTab === 'shadowVault' && (
            <ShadowVaultTests onTest={testShadowVault} loading={loading} />
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4">Result</h3>
            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// AtomicCounter Test Component
const AtomicCounterTests = ({ onTest, loading }) => {
  const [value, setValue] = useState('1');

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">AtomicCounter Tests</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2">Value (ETH)</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-gray-700 rounded-lg px-4 py-2 mb-4"
            placeholder="1"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onTest('increment', value)}
          disabled={loading}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          ➕ Increment
        </button>
        <button
          onClick={() => onTest('decrement', value)}
          disabled={loading}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          ➖ Decrement
        </button>
        <button
          onClick={() => onTest('current')}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          📊 Get Current
        </button>
        <button
          onClick={() => onTest('reset')}
          disabled={loading}
          className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );
};

// EncryptedSwap Test Component
const EncryptedSwapTests = ({ onTest, loading }) => {
  const [intent, setIntent] = useState('test_swap_intent');
  const [nonce, setNonce] = useState('1');

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">EncryptedSwap Tests</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-2">Intent Data</label>
          <input
            type="text"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="w-full bg-gray-700 rounded-lg px-4 py-2"
            placeholder="encrypted_intent_data"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Async Nonce</label>
          <input
            type="number"
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
            className="w-full bg-gray-700 rounded-lg px-4 py-2"
            placeholder="1"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onTest('submitIntent', { intent, nonce })}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          📤 Submit Intent
        </button>
        <button
          onClick={() => onTest('getMetrics')}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          📊 Get Metrics
        </button>
      </div>
    </div>
  );
};

// FisherRewards Test Component
const FisherRewardsTests = ({ onTest, loading }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">FisherRewards Tests</h2>
      <p className="text-gray-400 mb-4">Test the Fisher bot reward system</p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onTest('register')}
          disabled={loading}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          ✅ Register Fisher
        </button>
        <button
          onClick={() => onTest('getStats')}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          📊 Get Stats
        </button>
        <button
          onClick={() => onTest('claim')}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          💰 Claim Rewards
        </button>
        <button
          onClick={() => onTest('getPool')}
          disabled={loading}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          🏦 Pool Stats
        </button>
        <button
          onClick={() => onTest('fund')}
          disabled={loading}
          className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          💵 Fund Pool (1 ETH)
        </button>
      </div>
    </div>
  );
};

// AsyncNonce Test Component
const AsyncNonceTests = ({ onTest, loading }) => {
  const [nonce, setNonce] = useState('1');

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">AsyncNonceEngine Tests</h2>
      <div className="mb-4">
        <label className="block text-sm mb-2">Nonce to Settle</label>
        <input
          type="number"
          value={nonce}
          onChange={(e) => setNonce(e.target.value)}
          className="w-full md:w-64 bg-gray-700 rounded-lg px-4 py-2"
          placeholder="1"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onTest('getPending')}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          📊 Get Pending Nonces
        </button>
        <button
          onClick={() => onTest('hasPending')}
          disabled={loading}
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          ❓ Has Pending
        </button>
        <button
          onClick={() => onTest('settle', { nonce })}
          disabled={loading}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          ✅ Settle Nonce
        </button>
      </div>
    </div>
  );
};

// ShadowVault Test Component
const ShadowVaultTests = ({ onTest, loading }) => {
  const [data, setData] = useState('my_encrypted_position');
  const [posId, setPosId] = useState('0');

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">ShadowVault Tests</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-2">Encrypted Data</label>
          <input
            type="text"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full bg-gray-700 rounded-lg px-4 py-2"
            placeholder="encrypted_position_data"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">Position ID</label>
          <input
            type="number"
            value={posId}
            onChange={(e) => setPosId(e.target.value)}
            className="w-full bg-gray-700 rounded-lg px-4 py-2"
            placeholder="0"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onTest('create', { data })}
          disabled={loading}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          ➕ Create Position
        </button>
        <button
          onClick={() => onTest('getCount')}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          📊 Get Count
        </button>
        <button
          onClick={() => onTest('getPosition', { id: posId })}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg font-semibold"
        >
          🔍 Get Position
        </button>
      </div>
    </div>
  );
};

export default ContractTester;

