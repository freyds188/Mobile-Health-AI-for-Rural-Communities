# Metrics for rural_health_dataset

- **modelId**: production_model_1758387706793
- **accuracy_source**: severity_proxy
- **note**: No ground-truth labels found; used severity-based proxy labels.

## Summary
- **accuracy**: 0.8800
- **macro_precision**: 0.7762
- **macro_recall**: 0.9096
- **macro_f1**: 0.8142

## Per-class
- low: precision=0.5000, recall=1.0000, f1=0.6667, support=4
- medium: precision=0.9714, recall=0.8718, f1=0.9189, support=39
- high: precision=0.8571, recall=0.8571, f1=0.8571, support=7

## Confusion Matrix (rows=true, cols=pred)
|       | low | medium | high |
|------:|----:|-------:|-----:|
| low   | 4 | 0 | 0 |
| medium| 4 | 34 | 1 |
| high  | 0 | 1 | 6 |
