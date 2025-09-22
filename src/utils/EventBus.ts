type EventHandler = (payload?: any) => void;

class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    const set = this.listeners.get(event)!;
    set.add(handler);
    return () => {
      set.delete(handler);
      if (set.size === 0) this.listeners.delete(event);
    };
  }

  emit(event: string, payload?: any): void {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return;
    // Call handlers asynchronously to avoid blocking UI
    set.forEach(h => {
      try { setTimeout(() => h(payload), 0); } catch {}
    });
  }
}

export const eventBus = new EventBus();


