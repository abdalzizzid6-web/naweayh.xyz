type EventCallback = (data: any) => void;

export class EventBus {
  private static listeners: Map<string, Set<EventCallback>> = new Map();

  public static subscribe(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  public static publish(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[EventBus] Error handling event ${event}:`, err);
        }
      });
    }
  }
}
