/**
 * Dashboard Component
 * Main portfolio view for Shadow Economy
 */

import { useState } from 'react'
import EncryptedBalance from './EncryptedBalance'
import { useLitProtocol } from '../hooks/useLitProtocol'

function Dashboard() {
  const [isConnected, setIsConnected] = useState(false)
  const { isInitialized } = useLitProtocol()

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🌑 Shadow Economy
            </h1>
            <p className="text-gray-400">
              Privacy-Preserving DeFi on EVVM
            </p>
          </div>
          <button 
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            onClick={() => setIsConnected(!isConnected)}
          >
            {isConnected ? 'Connected' : 'Connect Wallet'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {/* System Status */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">System Status:</span>
            <div className="flex gap-3">
              <StatusIndicator label="EVVM" status="connected" />
              <StatusIndicator label="Lit Protocol" status={isInitialized ? "active" : "initializing"} />
              <StatusIndicator label="Pyth Oracle" status="live" />
            </div>
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <EncryptedBalance />
          
          <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              Private Positions
            </h2>
            <p className="text-gray-400 text-center py-8">
              {isConnected 
                ? 'Your encrypted positions will appear here'
                : 'Connect wallet to view positions'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard 
            title="Private Swap"
            description="Trade tokens without public visibility"
            icon="🔄"
          />
          <ActionCard 
            title="Lend Assets"
            description="Earn yield on your encrypted positions"
            icon="💰"
          />
          <ActionCard 
            title="View Metrics"
            description="Check aggregate market data"
            icon="📊"
          />
        </div>

        {/* Info Banner */}
        <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <p className="text-sm text-gray-400 text-center">
            🔐 All transactions are end-to-end encrypted via Lit Protocol • 
            Interact via WhatsApp or Telegram for maximum privacy • 
            No transaction history visible on-chain
          </p>
        </div>
      </main>
    </div>
  )
}

// Status Indicator Component
function StatusIndicator({ label, status }) {
  const statusColors = {
    connected: 'bg-green-500',
    active: 'bg-green-500',
    live: 'bg-green-500',
    initializing: 'bg-yellow-500',
    offline: 'bg-red-500'
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${statusColors[status]}`}></span>
      <span className="text-sm text-gray-300">{label}</span>
    </div>
  )
}

// Action Card Component
function ActionCard({ title, description, icon }) {
  return (
    <button className="p-6 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors text-left">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </button>
  )
}

export default Dashboard

