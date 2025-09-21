### Expected Results and Evaluation

This prototype’s MATLAB evaluator (`matlab/test_prototype_algorithm.m`) reproduces the risk computation used in `src/services/ProductionRiskAssessment.ts` and reports accuracy metrics when labels are available.

What the outputs should be when you run the script from the project root:

- **Per-dataset result CSVs**: Already generated as `results_*.csv` containing columns:
  - `timestamp, severity, sleep, stress, exercise, diet, symptoms`
  - `severityRisk, lifestyleRisk, symptomRisk, riskScore, overallRisk`
  - `confidence, followUpRecommended, modelId`

- **Per-dataset metrics markdown**: After updating the script, running it produces `metrics_<dataset>.md` files with:
  - **accuracy_source**: `riskLevel`/`trueRisk` if present, else `severity_proxy`
  - **accuracy, macro_precision, macro_recall, macro_f1**
  - **per-class** precision/recall/F1/support for `low/medium/high`
  - **confusion matrix** (rows=true, cols=pred)

Ground-truth labels:
- If your CSV has a label column (any of `riskLevel, risk_level, trueRisk, label, groundTruth, ground_truth`), it will be used.
- If not, a documented proxy is used based on severity only: `severity >= 8 → high`, `>= 5 → medium`, else `low`.

How to run:
1) In MATLAB: `>> matlab/test_prototype_algorithm`
2) Expect output CSVs (already present) and new `metrics_*.md` files in the project root.

Note on reproducibility:
- Confidence values include a small random component; accuracy metrics are label-based and deterministic given the dataset.


