#!/bin/bash

echo "🚀 Starting K-means Model Training..."
echo

# Change to script directory
cd "$(dirname "$0")"

echo "📊 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo

echo "📦 Installing dependencies if needed..."
npm install
echo

echo "🧠 Running K-means training script..."
npx ts-node src/scripts/trainKMeansModel.ts

if [ $? -eq 0 ]; then
    echo
    echo "✅ K-means training completed successfully!"
    echo
    echo "📋 Training Summary:"
    echo "   - Model type: K-means clustering"
    echo "   - Datasets processed: Multiple health datasets"
    echo "   - Output: Trained model saved to database"
    echo
else
    echo
    echo "❌ Training failed with error code $?"
    exit 1
fi
