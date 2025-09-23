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

Supported CSVs in `datasets/` folder (scripts will copy them to `training/datasets/` on first run):
- `datasets/basic_health_assessment_dataset.csv`
- `datasets/temporal_health_patterns_dataset.csv`
- `datasets/general_health_symptoms_dataset.csv`
- `datasets/rural_healthcare_access_dataset.csv`, `datasets/mental_health_conditions_dataset.csv` (optional real data examples)

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

## MATLAB Analysis (SOP 1 and SOP 3)

We provide MATLAB scripts to implement and evaluate:

- SOP 1: K-means clustering to detect recurring symptom patterns over time in rural patient data.
- SOP 3: Supervised models (SVM, Decision Tree) to classify risk based on age, gender, past conditions, and current symptoms.

Outputs (figures, .mat files, and CSV summaries) are saved under:

`matlab/results/project_evaluation/`

### How to Run

Windows PowerShell (MATLAB must be on PATH):

```powershell
matlab -batch "run_all('C:/Users/aldri/OneDrive/Desktop/THESIS-2')"
```

Or in MATLAB Command Window:

```matlab
run_all('C:/Users/aldri/OneDrive/Desktop/THESIS-2')
```

Run modules individually:

```matlab
sop1_kmeans('C:/Users/aldri/OneDrive/Desktop/THESIS-2', 4, 'sqeuclidean');
sop3_classification('File: preprocessData.m Line: 23 Column: 5
Function argument definition error in preprocessData. varargin can only be used inside Repeating arguments block.

Error in sop1_kmeans (line 29)
[X, featureNames, ~, timeVec, meta] = preprocessData(T, "TopSymptoms", 25, "TopConditions", 20, "Standardize", true);', {"svm","tree"});
```

### Data

- If CSVs exist in `datasets/`, the scripts will load them. Otherwise, a synthetic dataset is generated with realistic patterns, including symptoms, timestamps, demographics, and labels.

### What is Produced

- SOP1 (K-means): PCA cluster plot, cluster distribution over time, silhouette plot, top-features per cluster; metrics (inertia, silhouette mean, cluster sizes); `sop1_kmeans_result.mat` and `sop1_cluster_sizes.csv`.
- SOP3 (Classification): Confusion matrices, optional score distributions, feature importance (trees); metrics CSV `sop3_metrics_summary.csv` and `sop3_classification_results.mat`.

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