# Metrics for enhanced_training_dataset

- **modelId**: production_model_1758387706793
- **accuracy_source**: severity_proxy
- **note**: No ground-truth labels found; used severity-based proxy labels.

## Summary
- **accuracy**: 0.6400
- **macro_precision**: 0.7469
- **macro_recall**: 0.6002
- **macro_f1**: 0.5608

## Per-class
- low: precision=0.4565, recall=0.9545, f1=0.6176, support=22
- medium: precision=0.7843, recall=0.6154, f1=0.6897, support=65
- high: precision=1.0000, recall=0.2308, f1=0.3750, support=13

## Confusion Matrix (rows=true, cols=pred)
|       | low | medium | high |
|------:|----:|-------:|-----:|
| low   | 21 | 1 | 0 |
| medium| 25 | 40 | 0 |
| high  | 0 | 10 | 3 |
