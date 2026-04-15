type ConnectivityListener = (isOnline: boolean) => void;
type CleanupFn = () => void;

class ConnectivityManager {
  private _isOnline: boolean = true;
  private listeners: ConnectivityListener[] = [];
  private cleanup: CleanupFn | null = null;

  get isOnline(): boolean {
    return this._isOnline;
  }

  async initialize(): Promise<void> {
    this._isOnline = navigator.onLine;

    const handleOnline = () => this.updateOnlineStatus(true);
    const handleOffline = () => this.updateOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    this.cleanup = () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  private updateOnlineStatus(newOnline: boolean): void {
    const wasOnline = this._isOnline;
    this._isOnline = newOnline;

    if (wasOnline !== this._isOnline) {
      for (const listener of this.listeners) {
        listener(this._isOnline);
      }
    }
  }

  addListener(callback: ConnectivityListener): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  dispose(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
    this.listeners = [];
  }
}

export const connectivityManager = new ConnectivityManager();
