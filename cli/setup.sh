#!/bin/bash

# Shadow Economy CLI - Quick Setup Script

echo "🚀 Shadow Economy CLI Tester - Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"
echo ""

# Check if in cli directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the cli directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Setup environment file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your configuration:"
    echo "   - Set your PRIVATE_KEY"
    echo "   - Update RPC_URL if needed"
    echo "   - Update CHAIN_ID if needed"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Check if contracts are deployed
echo "🔍 Checking contract deployments..."
if [ -f "../contracts/deployments.json" ]; then
    echo "✅ Contract deployments found"
    echo ""
    echo "📋 Deployed contracts:"
    cat ../contracts/deployments.json | grep -E '"(EncryptedSwap|PythAdapter|SimpleLending)"' || echo "   No contracts found in deployments.json"
else
    echo "⚠️  No deployments.json found"
    echo "   Please deploy contracts first: cd ../contracts && npm run deploy"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Edit .env with your private key and RPC URL"
echo "   2. Ensure contracts are deployed (check ../contracts/deployments.json)"
echo "   3. Run the CLI: npm start"
echo ""
echo "📖 For more information, see README.md"
echo ""
