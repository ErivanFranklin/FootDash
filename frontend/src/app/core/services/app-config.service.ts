import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AppConfig {
  apiBaseUrl: string;
  wsUrl: string;
  authPath: string;
  pushPublicKey: string;
}

/**
 * Runtime configuration service that allows environment values to be
 * overridden at deploy time via `assets/config/app-config.json`.
 *
 * In production Docker builds the JSON file is generated/mounted by
 * the nginx entrypoint script so that the same image can be pointed
 * at any backend without rebuilding.
 *
 * During local development the file is optional — Angular environment
 * defaults are used as-is.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private config: AppConfig = {
    apiBaseUrl: environment.apiBaseUrl,
    wsUrl: environment.websocketUrl,
    authPath: environment.authPath,
    pushPublicKey: environment.pushPublicKey,
  };

  /** Called from APP_INITIALIZER before the app bootstraps. */
  async load(): Promise<void> {
    try {
      const resp = await fetch('assets/config/app-config.json');
      if (resp.ok) {
        const json = await resp.json();
        const isLocalhost = this.isLocalhostRuntime();
        // Only override values that are actually present and non-empty
        if (json.apiBaseUrl) {
          if (!isLocalhost || !this.isRemoteAbsoluteUrl(json.apiBaseUrl)) {
            this.config.apiBaseUrl = json.apiBaseUrl;
          }
        }
        if (json.wsUrl) {
          if (!isLocalhost || !this.isRemoteAbsoluteUrl(json.wsUrl)) {
            this.config.wsUrl = json.wsUrl;
          }
        }
        if (json.authPath) this.config.authPath = json.authPath;
        if (json.pushPublicKey) this.config.pushPublicKey = json.pushPublicKey;
      }
    } catch {
      // Config file not found or invalid — use compile-time defaults
    }
  }

  private isLocalhostRuntime(): boolean {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
  }

  private isRemoteAbsoluteUrl(value: string): boolean {
    if (!/^https?:\/\//i.test(value)) return false;
    try {
      const parsed = new URL(value);
      const host = parsed.hostname;
      return host !== 'localhost' && host !== '127.0.0.1';
    } catch {
      return false;
    }
  }

  get apiBaseUrl(): string {
    return this.config.apiBaseUrl;
  }

  get wsUrl(): string {
    return this.config.wsUrl;
  }

  get authPath(): string {
    return this.config.authPath;
  }

  get pushPublicKey(): string {
    return this.config.pushPublicKey;
  }

  /** Convenience: full auth URL (apiBaseUrl + authPath) */
  get authUrl(): string {
    const base = this.config.apiBaseUrl?.replace(/\/$/, '') || '';
    const path = this.config.authPath?.startsWith('/')
      ? this.config.authPath
      : `/${this.config.authPath || ''}`;
    return `${base}${path}`;
  }
}
