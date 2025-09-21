# Metrics for comprehensive_symptom_dataset

- **modelId**: production_model_1758387706793
- **accuracy_source**: severity_proxy
- **note**: No ground-truth labels found; used severity-based proxy labels.

## Summary
- **accuracy**: 0.7800
- **macro_precision**: 0.7665
- **macro_recall**: 0.8604
- **macro_f1**: 0.7784

## Per-class
- low: precision=0.5000, recall=1.0000, f1=0.6667, support=17
- medium: precision=0.9574, recall=0.6923, f1=0.8036, support=65
- high: precision=0.8421, recall=0.8889, f1=0.8649, support=18

## Confusion Matrix (rows=true, cols=pred)
|       | low | medium | high |
|------:|----:|-------:|-----:|
| low   | 17 | 0 | 0 |
| medium| 17 | 45 | 3 |
| high  | 0 | 2 | 16 |
