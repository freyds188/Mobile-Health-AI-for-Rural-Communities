## Health AI Mobile App — Unified Guide

One document to install, run, and train all machine learning features in this system.

## Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm i -g @expo/cli`
- Android Studio (Android) or Xcode/iOS Simulator (macOS)
- Git
- Optional: Python 3 (dataset analysis helper)

## Quick Start

1) Clone and install

```bash
git clone <your-repo-url>
cd THESIS-2
npm install
```

2) Run the app (choose one)

```bash
npm start          # Expo dev menu
npm run android    # Launch Android emulator/device
npm run ios        # Launch iOS simulator (macOS)
npm run web        # Run in browser
```

## Configuration

- App configuration lives in `src/config/AppConfig.ts`.
- If you use environment variables, create a `.env` in project root as needed (e.g., `API_URL`, `ENCRYPTION_KEY`).
- Model deployment settings: `deployed-model-config.json`.

## Datasets

Supported CSVs in project root (scripts will move them to `training/datasets/` on first run):
- `training_dataset.csv`
- `enhanced_training_dataset.csv`
- `comprehensive_symptom_dataset.csv`
- `rural_health_dataset.csv`, `mental_health_dataset.csv` (optional real data examples)

## Machine Learning — Scripts Overview

All ML scripts are TypeScript and runnable via npm scripts (see `package.json`).

- Train basic K-means: `npm run train:basic`
- Train advanced K-means: `npm run train:advanced`
- Validate trained model: `npm run validate:model`
- Train using real data pipeline: `npm run train:real`
- Train NLP model: `npm run train:nlp`
- Seed NLP training data only: `npm run seed:nlp`
- Seed then train NLP: `npm run seed:nlp:all`
- Generate conversational dataset: `npm run generate:conv-dataset`
- Deploy the current model config: `npm run deploy:model`
- Health data logging test: `npm run test:health-data`

Locations:
- Scripts: `src/scripts/*`
- Services used by training/inference: `src/services/*`

## End-to-End Training (Interactive)

Use the helper scripts to guide you through setup and training.

Windows:

```bat
train_model.bat
```

macOS/Linux:

```bash
./train_model.sh
```

These will:
1) Check Node/npm
2) Install dependencies if needed
3) Create `training/` folders and move datasets
4) Let you choose Basic/Advanced/Validate/Analyze/All-in-one

For a minimal one-liner run:

```bash
npm run train:basic && npm run validate:model
```

## Running the App with Trained Models

1) Train a model (see above).
2) Ensure `deployed-model-config.json` points to your intended model/output.
3) Start the app with `npm start` and use the risk assessment and chatbot screens.
4) Optional: Host your model artifacts
   - Run `npm run generate:model-manifest` (creates `public/model-manifest.json` with `nlp-model.json` and `deployed-model-config.json`).
   - Enable GitHub Pages for the repo; the CI workflow `.github/workflows/model-pipeline.yml` publishes to Pages on push.
   - In code (e.g., `InitializeApp`), set the manifest URL via `ModelDeploymentService#setRegistryManifestUrl('https://<user>.github.io/<repo>/model-manifest.json')`.

## NLP Workflow (Optional)

1) Generate or edit dataset: `npm run generate:conv-dataset`
2) Seed data: `npm run seed:nlp`
3) Train NLP: `npm run train:nlp`
4) Confirm `nlp-model.json` is generated/updated

## Troubleshooting

- Clear Node modules and reinstall: `rm -rf node_modules && npm install` (Windows: delete folder manually)
- Metro cache issue: `npx expo start -c`
- Android build tools not found: open Android Studio once, install SDKs, set ANDROID_HOME/SDK path in environment variables.
- Permission issues on macOS/Linux: `chmod +x *.sh`

## Project Structure (high level)

```
src/
  components/      # UI components
  contexts/        # App context providers (auth, health data, chatbot)
  navigation/      # Navigators and stacks
  screens/         # Screens including RiskAssessment, Chatbot, Training, etc.
  services/        # Database, ML, NLP, deployment, risk assessment services
  utils/           # Helpers (initialization, dataset loader, testing)
  scripts/         # All training/validation/deploy scripts
```

## License and Notice

This repository is provided for academic and development purposes. Not a medical device. Use responsibly.