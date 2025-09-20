// Centralized error handling and logging wrapper

type Fn<T> = (...args: any[]) => Promise<T>;

export class ErrorHandler {
  async run<T>(label: string, fn: Fn<T>, fallback?: T): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      console.error(`[${label}]`, e);
      if (fallback !== undefined) return fallback;
      throw e;
    }
  }
}

export const errorHandler = new ErrorHandler();


