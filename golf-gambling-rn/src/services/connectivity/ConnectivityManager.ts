import { Platform } from 'react-native';

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
    if (Platform.OS === 'web') {
      this._isOnline = navigator.onLine;

      const handleOnline = () => this.updateOnlineStatus(true);
      const handleOffline = () => this.updateOnlineStatus(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      this.cleanup = () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
      return;
    }

    // Native: dynamic require so the web bundler doesn't resolve expo-network
    const Network = require('expo-network');

    try {
      const state = await Network.getNetworkStateAsync();
      this._isOnline = state.isConnected === true && state.isInternetReachable !== false;
    } catch {
      // Assume online if we can't determine
      this._isOnline = true;
    }

    const subscription = Network.addNetworkStateListener((state: any) => {
      const newOnline = state.isConnected === true && state.isInternetReachable !== false;
      this.updateOnlineStatus(newOnline);
    });

    this.cleanup = () => {
      subscription.remove();
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
