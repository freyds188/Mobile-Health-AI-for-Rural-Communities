let AsyncStorage: any;
try {
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  }
} catch {
  AsyncStorage = null;
}

export interface PerformanceSnapshot {
  modelId: string;
  timestamp: string;
  f1Score: number;
  accuracy: number;
}

export class ModelMonitoringService {
  private static HISTORY_KEY = 'model_performance_history_v1';

  async recordPerformance(snapshot: PerformanceSnapshot): Promise<void> {
    try {
      if (!AsyncStorage) return;
      const raw = await AsyncStorage.getItem(ModelMonitoringService.HISTORY_KEY);
      const history: PerformanceSnapshot[] = raw ? JSON.parse(raw) : [];
      history.push(snapshot);
      const trimmed = history.slice(-50);
      await AsyncStorage.setItem(ModelMonitoringService.HISTORY_KEY, JSON.stringify(trimmed));
    } catch {}
  }

  async getRecentPerformance(): Promise<PerformanceSnapshot[]> {
    try {
      if (!AsyncStorage) return [];
      const raw = await AsyncStorage.getItem(ModelMonitoringService.HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  assessRegression(current: { f1: number; acc: number }, baseline?: { f1: number; acc: number }, tolerances = { f1: 0.01, acc: 0.01 }): { degraded: boolean; reasons: string[] } {
    const reasons: string[] = [];
    if (!baseline) return { degraded: false, reasons };
    if (current.f1 < baseline.f1 - tolerances.f1) reasons.push('F1 dropped beyond tolerance');
    if (current.acc < baseline.acc - tolerances.acc) reasons.push('Accuracy dropped beyond tolerance');
    return { degraded: reasons.length > 0, reasons };
  }
}

export const modelMonitoringService = new ModelMonitoringService();


