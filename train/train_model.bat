@echo off
REM Health AI Model Training Quick Start Script for Windows
REM This script helps you train and validate your K-means ML model

echo 🏥 Health AI Model Training Quick Start
echo ======================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

REM Create training directory structure
echo 📁 Setting up training directories...
if not exist "training" mkdir training
if not exist "training\datasets" mkdir training\datasets
if not exist "training\models" mkdir training\models
if not exist "training\results" mkdir training\results

REM Copy datasets if they exist
if exist "datasets\basic_health_assessment_dataset.csv" (
    copy datasets\basic_health_assessment_dataset.csv training\datasets\
    echo ✅ Copied basic_health_assessment_dataset.csv to training/datasets/
)

if exist "datasets\temporal_health_patterns_dataset.csv" (
    copy datasets\temporal_health_patterns_dataset.csv training\datasets\
    echo ✅ Copied temporal_health_patterns_dataset.csv to training/datasets/
)

if exist "dataset_analyzer.py" (
    move dataset_analyzer.py training\
    echo ✅ Moved dataset_analyzer.py to training/
)

echo.
echo 🚀 TRAINING OPTIONS
echo ==================
echo 1. Basic Training (Quick, ~2 minutes)
echo 2. Advanced Training (Comprehensive, ~5 minutes)
echo 3. Model Validation (Test model performance)
echo 4. Dataset Analysis (Python required)
echo 5. Run All (Complete training pipeline)
echo.

set /p choice="Choose an option (1-5): "

if "%choice%"=="1" (
    echo 🚀 Starting Basic Training...
    call npm run train:basic
) else if "%choice%"=="2" (
    echo 🔬 Starting Advanced Training...
    call npm run train:advanced
) else if "%choice%"=="3" (
    echo 🧪 Starting Model Validation...
    call npm run validate:model
) else if "%choice%"=="4" (
    echo 📊 Running Dataset Analysis...
    python --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Python is required for dataset analysis
        echo 💡 Please install Python to run dataset analysis
    ) else (
        call npm run analyze:dataset
    )
) else if "%choice%"=="5" (
    echo 🎯 Running Complete Training Pipeline...
    echo.
    
    echo Step 1/4: Dataset Analysis...
    python --version >nul 2>&1
    if errorlevel 1 (
        echo ⚠️ Skipping dataset analysis (Python not found)
    ) else (
        call npm run analyze:dataset
    )
    
    echo.
    echo Step 2/4: Basic Training...
    call npm run train:basic
    
    echo.
    echo Step 3/4: Advanced Training...
    call npm run train:advanced
    
    echo.
    echo Step 4/4: Model Validation...
    call npm run validate:model
    
    echo.
    echo 🎉 Complete training pipeline finished!
) else (
    echo ❌ Invalid option. Please choose 1-5.
    pause
    exit /b 1
)

echo.
echo ✅ Training process completed!
echo.
echo 💡 Next Steps:
echo 1. Review the training results above
echo 2. Check the console output for model performance metrics
echo 3. If satisfied with results, integrate the model into your app
echo 4. Set up continuous learning for production deployment
echo.
echo 📚 For detailed instructions, see: README.md

pause
