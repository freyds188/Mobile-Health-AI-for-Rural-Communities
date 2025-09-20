import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedOperation<T = any> {
  id: string;
  type: string; // e.g., 'saveHealthData'
  payload: T;
  createdAt: number;
  retries: number;
}

const STORAGE_KEY = 'offline_queue_v1';

export class OfflineQueue {
  private queue: QueuedOperation[] = [];
  private isLoaded = false;

  async load(): Promise<void> {
    if (this.isLoaded) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      this.queue = raw ? JSON.parse(raw) : [];
    } catch {
      this.queue = [];
    } finally {
      this.isLoaded = true;
    }
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch {}
  }

  async enqueue(op: Omit<QueuedOperation, 'createdAt' | 'retries'>): Promise<void> {
    await this.load();
    this.queue.push({ ...op, createdAt: Date.now(), retries: 0 });
    await this.persist();
  }

  async drain(processor: (op: QueuedOperation) => Promise<boolean>): Promise<number> {
    await this.load();
    let processed = 0;
    const remaining: QueuedOperation[] = [];
    for (const op of this.queue) {
      try {
        const ok = await processor(op);
        if (ok) processed++;
        else {
          remaining.push({ ...op, retries: op.retries + 1 });
        }
      } catch {
        remaining.push({ ...op, retries: op.retries + 1 });
      }
    }
    this.queue = remaining.slice(0, 200); // cap queue size
    await this.persist();
    return processed;
  }
}

export const offlineQueue = new OfflineQueue();


