#!/bin/bash

# Health AI Model Training Quick Start Script
# This script helps you train and validate your K-means ML model

echo "🏥 Health AI Model Training Quick Start"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Create training directory structure
echo "📁 Setting up training directories..."
mkdir -p training/datasets
mkdir -p training/models
mkdir -p training/results

# Copy datasets if they exist
if [ -f "training_dataset.csv" ]; then
    mv training_dataset.csv training/datasets/
    echo "✅ Moved training_dataset.csv to training/datasets/"
fi

if [ -f "enhanced_training_dataset.csv" ]; then
    mv enhanced_training_dataset.csv training/datasets/
    echo "✅ Moved enhanced_training_dataset.csv to training/datasets/"
fi

if [ -f "dataset_analyzer.py" ]; then
    mv dataset_analyzer.py training/
    echo "✅ Moved dataset_analyzer.py to training/"
fi

echo ""
echo "🚀 TRAINING OPTIONS"
echo "=================="
echo "1. Basic Training (Quick, ~2 minutes)"
echo "2. Advanced Training (Comprehensive, ~5 minutes)"
echo "3. Model Validation (Test model performance)"
echo "4. Dataset Analysis (Python required)"
echo "5. Run All (Complete training pipeline)"
echo ""

read -p "Choose an option (1-5): " choice

case $choice in
    1)
        echo "🚀 Starting Basic Training..."
        npm run train:basic
        ;;
    2)
        echo "🔬 Starting Advanced Training..."
        npm run train:advanced
        ;;
    3)
        echo "🧪 Starting Model Validation..."
        npm run validate:model
        ;;
    4)
        echo "📊 Running Dataset Analysis..."
        if command -v python &> /dev/null; then
            npm run analyze:dataset
        else
            echo "❌ Python is required for dataset analysis"
            echo "💡 Please install Python to run dataset analysis"
        fi
        ;;
    5)
        echo "🎯 Running Complete Training Pipeline..."
        echo ""
        
        echo "Step 1/4: Dataset Analysis..."
        if command -v python &> /dev/null; then
            npm run analyze:dataset
        else
            echo "⚠️ Skipping dataset analysis (Python not found)"
        fi
        
        echo ""
        echo "Step 2/4: Basic Training..."
        npm run train:basic
        
        echo ""
        echo "Step 3/4: Advanced Training..."
        npm run train:advanced
        
        echo ""
        echo "Step 4/4: Model Validation..."
        npm run validate:model
        
        echo ""
        echo "🎉 Complete training pipeline finished!"
        ;;
    *)
        echo "❌ Invalid option. Please choose 1-5."
        exit 1
        ;;
esac

echo ""
echo "✅ Training process completed!"
echo ""
echo "💡 Next Steps:"
echo "1. Review the training results above"
echo "2. Check the console output for model performance metrics"
echo "3. If satisfied with results, integrate the model into your app"
echo "4. Set up continuous learning for production deployment"
echo ""
echo "📚 For detailed instructions, see: README.md"
