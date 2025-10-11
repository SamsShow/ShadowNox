/**
 * Encrypted Balance Component
 * Displays user's private balance information
 */

import { useState } from 'react'

function EncryptedBalance() {
  const [isDecrypted, setIsDecrypted] = useState(false)

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-white">
          Portfolio Balance
        </h2>
        <button
          onClick={() => setIsDecrypted(!isDecrypted)}
          className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
        >
          {isDecrypted ? '🔓 Hide' : '🔐 Decrypt'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Total Balance */}
        <div>
          <p className="text-sm text-gray-400 mb-1">Total Value</p>
          <p className="text-3xl font-bold text-white">
            {isDecrypted ? '$XX,XXX.XX' : '••••••••'}
          </p>
        </div>

        {/* Asset Breakdown */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-3">Assets</p>
          <div className="space-y-2">
            <AssetRow 
              token="ETH"
              amount={isDecrypted ? "X.XXXX" : "••••"}
              value={isDecrypted ? "$X,XXX" : "••••"}
            />
            <AssetRow 
              token="USDC"
              amount={isDecrypted ? "X,XXX.XX" : "••••"}
              value={isDecrypted ? "$X,XXX" : "••••"}
            />
          </div>
        </div>

        {/* Privacy Note */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            🔐 Encrypted via Lit Protocol • Decryption requires your signature
          </p>
        </div>
      </div>
    </div>
  )
}

// Asset Row Component
function AssetRow({ token, amount, value }) {
  return (
    <div className="flex justify-between items-center p-2 rounded hover:bg-gray-750">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm">
          {token[0]}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{token}</p>
          <p className="text-xs text-gray-400">{amount}</p>
        </div>
      </div>
      <p className="text-sm text-gray-300">{value}</p>
    </div>
  )
}

export default EncryptedBalance

