# Metrics for mental_health_dataset

- **modelId**: production_model_1758387706793
- **accuracy_source**: severity_proxy
- **note**: No ground-truth labels found; used severity-based proxy labels.

## Summary
- **accuracy**: 0.8100
- **macro_precision**: 0.6357
- **macro_recall**: 0.3830
- **macro_f1**: 0.4400

## Per-class
- low: precision=0.0000, recall=0.0000, f1=0.0000, support=0
- medium: precision=0.9070, recall=0.8764, f1=0.8914, support=89
- high: precision=1.0000, recall=0.2727, f1=0.4286, support=11

## Confusion Matrix (rows=true, cols=pred)
|       | low | medium | high |
|------:|----:|-------:|-----:|
| low   | 0 | 0 | 0 |
| medium| 11 | 78 | 0 |
| high  | 0 | 8 | 3 |
