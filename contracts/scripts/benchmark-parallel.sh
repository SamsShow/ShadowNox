#!/bin/bash

###############################################################################
# Arcology Parallel Execution Benchmark Script
# 
# Tests Shadow Economy contracts on Arcology parallel blockchain
# Target: 10,000-15,000 TPS
# 
# Usage:
#   ./benchmark-parallel.sh --transactions 10000 --users 100
#   ./benchmark-parallel.sh --preset high-throughput
#   ./benchmark-parallel.sh --compare
# 
# Features:
# - Submit concurrent transactions to Arcology
# - Measure TPS (transactions per second)
# - Track optimistic concurrency conflict rate
# - Monitor gas costs
# - Compare parallel vs sequential execution
###############################################################################

set -e

# Default configuration
TRANSACTIONS=10000
USERS=100
PRESET=""
MODE="run"
PATTERN="user_isolated"
TYPE="mixed"
VERBOSE=""
EXPORT=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --transactions|-t)
      TRANSACTIONS="$2"
      shift 2
      ;;
    --users|-u)
      USERS="$2"
      shift 2
      ;;
    --preset)
      PRESET="$2"
      shift 2
      ;;
    --compare)
      MODE="compare"
      shift
      ;;
    --generate)
      MODE="generate"
      shift
      ;;
    --pattern|-p)
      PATTERN="$2"
      shift 2
      ;;
    --type)
      TYPE="$2"
      shift 2
      ;;
    --verbose|-v)
      VERBOSE="--verbose"
      shift
      ;;
    --export)
      EXPORT="--export $2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --transactions, -t <num>   Number of transactions (default: 10000)"
      echo "  --users, -u <num>          Number of test users (default: 100)"
      echo "  --preset <name>            Use preset configuration"
      echo "  --compare                  Compare parallel vs sequential"
      echo "  --generate                 Generate batch without executing"
      echo "  --pattern, -p <type>       Batch pattern (default: user_isolated)"
      echo "  --type <type>              Transaction type (default: mixed)"
      echo "  --verbose, -v              Enable verbose output"
      echo "  --export <path>            Export results to JSON"
      echo "  --help, -h                 Show this help message"
      echo ""
      echo "Presets:"
      echo "  quick                      100 transactions, 10 users"
      echo "  moderate                   1,000 transactions, 50 users"
      echo "  high-throughput            10,000 transactions, 100 users"
      echo "  stress                     15,000 transactions, 200 users"
      echo "  conflict                   1,000 transactions with contention"
      echo ""
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo "======================================================================"
echo "🚀 Arcology Parallel Execution Benchmark"
echo "======================================================================"
echo ""
echo "Shadow Economy Smart Contracts"
echo "Target: 10,000-15,000 TPS on Arcology"
echo ""
echo "======================================================================"
echo ""

# Check dependencies
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    exit 1
fi

# Navigate to bots directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BOTS_DIR="$SCRIPT_DIR/../../bots"

if [ ! -d "$BOTS_DIR" ]; then
    echo "❌ ERROR: Bots directory not found at $BOTS_DIR"
    exit 1
fi

cd "$BOTS_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Build command
CMD="node src/arcology/benchmark-cli.js $MODE"

if [ -n "$PRESET" ]; then
    CMD="$CMD --preset $PRESET"
else
    CMD="$CMD --transactions $TRANSACTIONS --users $USERS"
fi

if [ "$MODE" = "run" ]; then
    CMD="$CMD --pattern $PATTERN --type $TYPE"
fi

if [ -n "$VERBOSE" ]; then
    CMD="$CMD $VERBOSE"
fi

if [ -n "$EXPORT" ]; then
    CMD="$CMD $EXPORT"
fi

echo "🔧 Configuration:"
if [ -n "$PRESET" ]; then
    echo "  Preset:        $PRESET"
else
    echo "  Transactions:  $TRANSACTIONS"
    echo "  Users:         $USERS"
    echo "  Pattern:       $PATTERN"
    echo "  Type:          $TYPE"
fi
echo "  Mode:          $MODE"
echo ""
echo "======================================================================"
echo ""

# Execute benchmark
echo "▶️  Starting benchmark..."
echo ""

eval $CMD

echo ""
echo "======================================================================"
echo "✅ Benchmark Complete"
echo "======================================================================"
echo ""

exit 0

