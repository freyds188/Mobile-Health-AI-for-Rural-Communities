# Metrics for training_dataset

- **modelId**: production_model_1758387706793
- **accuracy_source**: severity_proxy
- **note**: No ground-truth labels found; used severity-based proxy labels.

## Summary
- **accuracy**: 0.7300
- **macro_precision**: 0.8162
- **macro_recall**: 0.7500
- **macro_f1**: 0.7434

## Per-class
- low: precision=0.5769, recall=1.0000, f1=0.7317, support=30
- medium: precision=0.8718, recall=0.6071, f1=0.7158, support=56
- high: precision=1.0000, recall=0.6429, f1=0.7826, support=14

## Confusion Matrix (rows=true, cols=pred)
|       | low | medium | high |
|------:|----:|-------:|-----:|
| low   | 30 | 0 | 0 |
| medium| 22 | 34 | 0 |
| high  | 0 | 5 | 9 |
