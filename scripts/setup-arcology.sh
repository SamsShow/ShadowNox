#!/bin/bash

# Shadow Economy - Arcology Network Setup Script
# This script helps you set up and connect to Arcology network

set -e

echo "════════════════════════════════════════════════════════════════"
echo "🌐 SHADOW ECONOMY - ARCOLOGY NETWORK SETUP"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "Select Arcology network setup option:"
echo ""
echo "1) 🐳 Docker - Run Arcology DevNet locally (Recommended for testing)"
echo "2) 🌍 Testnet - Connect to Arcology public testnet"
echo "3) 🔧 Custom - Configure custom Arcology RPC endpoint"
echo "4) 💻 Hardhat - Use local Hardhat network (NO parallel execution)"
echo "5) ℹ️  Info - Learn about Arcology and parallel execution"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        print_info "Setting up Arcology DevNet with Docker..."
        echo ""
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            print_error "Docker is not installed!"
            echo ""
            echo "Please install Docker first:"
            echo "  macOS: https://docs.docker.com/desktop/install/mac-install/"
            echo "  Linux: https://docs.docker.com/engine/install/"
            echo "  Windows: https://docs.docker.com/desktop/install/windows-install/"
            exit 1
        fi
        
        print_success "Docker is installed"
        
        # Check if Arcology DevNet image exists
        print_info "Checking for Arcology DevNet Docker image..."
        
        if ! docker images | grep -q "arcology/devnet"; then
            print_warning "Arcology DevNet image not found. Pulling image..."
            echo ""
            print_info "Note: This is a PLACEHOLDER. Check Arcology documentation for actual image:"
            print_info "Visit: https://docs.arcology.network/getting-started/devnet"
            echo ""
            
            # This is a placeholder - replace with actual Arcology image when available
            print_warning "IMPORTANT: Update this script with the actual Arcology DevNet image"
            print_warning "Current placeholder: arcology/devnet:latest"
            echo ""
            
            read -p "Do you want to proceed with placeholder image? (y/n): " proceed
            if [ "$proceed" != "y" ]; then
                exit 0
            fi
        fi
        
        # Start Arcology DevNet
        print_info "Starting Arcology DevNet..."
        print_warning "Using port 8545 for RPC endpoint"
        echo ""
        
        # Check if port 8545 is already in use
        if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null ; then
            print_warning "Port 8545 is already in use"
            read -p "Stop existing service and continue? (y/n): " stop_service
            if [ "$stop_service" != "y" ]; then
                exit 0
            fi
        fi
        
        print_info "Docker run command (update with actual Arcology image):"
        echo ""
        echo "docker run -d --name arcology-devnet -p 8545:8545 arcology/devnet:latest"
        echo ""
        
        read -p "Start Arcology DevNet container? (y/n): " start_container
        if [ "$start_container" = "y" ]; then
            # This is placeholder - update with actual command
            print_warning "Update this command with actual Arcology DevNet Docker image"
            # docker run -d --name arcology-devnet -p 8545:8545 arcology/devnet:latest
        fi
        
        # Update .env file
        print_info "Updating contracts/.env file..."
        cat > contracts/.env << EOF
# Arcology DevNet (Docker)
ARCOLOGY_RPC_URL=http://localhost:8545
ARCOLOGY_CHAIN_ID=1234
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
PYTH_HERMES_URL=https://hermes.pyth.network
REPORT_GAS=true
EOF
        
        print_success "Configuration updated!"
        echo ""
        print_info "Next steps:"
        echo "  1. Verify Arcology is running: curl -X POST http://localhost:8545 -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}'"
        echo "  2. Deploy contracts: cd contracts && npx hardhat run scripts/deploy.js --network arcologyDevnet"
        echo "  3. Test parallel execution with multiple transactions"
        ;;
        
    2)
        echo ""
        print_info "Connecting to Arcology Testnet..."
        echo ""
        
        print_warning "You will need:"
        echo "  - Arcology Testnet RPC URL"
        echo "  - Testnet Chain ID"
        echo "  - Private key with testnet funds"
        echo ""
        
        read -p "Enter Arcology Testnet RPC URL [https://testnet-rpc.arcology.network]: " rpc_url
        rpc_url=${rpc_url:-https://testnet-rpc.arcology.network}
        
        read -p "Enter Arcology Testnet Chain ID [4321]: " chain_id
        chain_id=${chain_id:-4321}
        
        read -p "Enter your private key (without 0x prefix): " private_key
        
        # Update .env file
        print_info "Updating contracts/.env file..."
        cat > contracts/.env << EOF
# Arcology Testnet
ARCOLOGY_RPC_URL=$rpc_url
ARCOLOGY_CHAIN_ID=$chain_id
PRIVATE_KEY=0x$private_key
PYTH_HERMES_URL=https://hermes.pyth.network
REPORT_GAS=true
EOF
        
        print_success "Configuration updated!"
        echo ""
        print_info "Next steps:"
        echo "  1. Get testnet funds from Arcology faucet"
        echo "  2. Deploy contracts: cd contracts && npx hardhat run scripts/deploy.js --network arcologyTestnet"
        echo "  3. Test on public testnet"
        ;;
        
    3)
        echo ""
        print_info "Configuring custom Arcology RPC endpoint..."
        echo ""
        
        read -p "Enter Arcology RPC URL: " rpc_url
        read -p "Enter Chain ID: " chain_id
        read -p "Enter your private key (without 0x prefix): " private_key
        
        # Update .env file
        cat > contracts/.env << EOF
# Custom Arcology Network
ARCOLOGY_RPC_URL=$rpc_url
ARCOLOGY_CHAIN_ID=$chain_id
PRIVATE_KEY=0x$private_key
PYTH_HERMES_URL=https://hermes.pyth.network
REPORT_GAS=true
EOF
        
        print_success "Configuration updated!"
        ;;
        
    4)
        echo ""
        print_warning "Hardhat local network DOES NOT support parallel execution!"
        echo ""
        echo "Limitations:"
        echo "  ❌ Sequential transaction processing only"
        echo "  ❌ No parallel execution (can't test 10k-15k TPS)"
        echo "  ❌ No optimistic concurrency control"
        echo "  ❌ Standard EVM gas costs (not 100x cheaper)"
        echo ""
        echo "Use Hardhat for:"
        echo "  ✅ Quick contract logic testing"
        echo "  ✅ Development iteration"
        echo "  ✅ Basic functionality verification"
        echo ""
        
        read -p "Continue with Hardhat setup? (y/n): " continue_hardhat
        if [ "$continue_hardhat" = "y" ]; then
            cat > contracts/.env << EOF
# Hardhat Local Network (NOT Arcology - Sequential Execution Only)
ARCOLOGY_RPC_URL=http://localhost:8545
ARCOLOGY_CHAIN_ID=118
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
PYTH_HERMES_URL=https://hermes.pyth.network
REPORT_GAS=true
EOF
            
            print_success "Hardhat configuration set"
            print_info "Deploy with: cd contracts && npx hardhat run scripts/deploy.js --network hardhat"
        fi
        ;;
        
    5)
        echo ""
        print_info "About Arcology and Parallel Execution"
        echo ""
        echo "═══════════════════════════════════════════════════════════"
        echo "🚀 Arcology Parallel Blockchain"
        echo "═══════════════════════════════════════════════════════════"
        echo ""
        echo "Key Features:"
        echo "  • 100% EVM-equivalent (all Solidity contracts work)"
        echo "  • 10,000-15,000 TPS through parallel execution"
        echo "  • Multiple EVM instances running simultaneously"
        echo "  • Optimistic concurrency control"
        echo "  • 100x lower gas costs vs Ethereum L1"
        echo ""
        echo "How It Works:"
        echo "  1. Transactions are grouped into batches"
        echo "  2. Multiple EVM instances execute transactions in parallel"
        echo "  3. Conflicts are detected and resolved automatically"
        echo "  4. Final state is committed to blockchain"
        echo ""
        echo "Shadow Economy on Arcology:"
        echo "  • Parallel swap execution (multiple users simultaneously)"
        echo "  • Parallel lending operations"
        echo "  • AtomicCounter for conflict-resistant metrics"
        echo "  • Per-user storage isolation minimizes conflicts"
        echo ""
        echo "Learn More:"
        echo "  📖 Docs: https://docs.arcology.network"
        echo "  🌐 Website: https://arcology.network"
        echo "  📄 See: docs/ARCOLOGY_SIMULATION.md"
        echo ""
        ;;
        
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_success "Setup complete!"
echo ""
print_info "Read docs/ARCOLOGY_SIMULATION.md for detailed information"
echo "═══════════════════════════════════════════════════════════════"

