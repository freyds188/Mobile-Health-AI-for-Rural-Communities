@echo off
echo 🚀 Starting K-means Model Training...
echo.

cd /d "%~dp0"

echo 📊 Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

echo 📦 Installing dependencies if needed...
npm install
echo.

echo 🧠 Running K-means training script...
npx ts-node src/scripts/trainKMeansModel.ts

if errorlevel 1 (
    echo.
    echo ❌ Training failed with error code %errorlevel%
    pause
    exit /b 1
) else (
    echo.
    echo ✅ K-means training completed successfully!
    echo.
    echo 📋 Training Summary:
    echo    - Model type: K-means clustering
    echo    - Datasets processed: Multiple health datasets
    echo    - Output: Trained model saved to database
    echo.
)

pause
