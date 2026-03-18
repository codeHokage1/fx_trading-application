import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';

// Supported trading currencies
export const SUPPORTED_CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP', 'CAD', 'JPY'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export interface RateMap {
  base: string;
  rates: Record<string, number>;
  fetchedAt: string;
}

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);
  private readonly CACHE_KEY = 'fx:rates';
  private lastKnownRates: RateMap | null = null; // fallback if API fails

  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {}

  async getRates(): Promise<RateMap> {
    const cached = await this.cache.get<RateMap>(this.CACHE_KEY);
    if (cached) return cached;

    return this.fetchAndCache();
  }

  // Returns how many units of `to` you get for 1 unit of `from`
  async getRate(from: string, to: string): Promise<number> {
    const { rates } = await this.getRates();

    if (!rates[from] || !rates[to]) {
      throw new ServiceUnavailableException(`Rate unavailable for ${from}/${to}`);
    }

    // Cross-rate via USD base: from→USD→to
    return rates[to] / rates[from];
  }

  private async fetchAndCache(): Promise<RateMap> {
    const apiKey = this.config.get<string>('app.fxApiKey');
    const baseUrl = this.config.get<string>('app.fxBaseUrl');
    const ttl = this.config.get<number>('app.fxCacheTtl');

    try {
      const res = await fetch(`${baseUrl}/${apiKey}/latest/USD`);
      if (!res.ok) throw new Error(`FX API responded with ${res.status}`);

      const json = await res.json() as { conversion_rates: Record<string, number> };
      const rates = json.conversion_rates;

      const data: RateMap = { base: 'USD', rates, fetchedAt: new Date().toISOString() };
      await this.cache.set(this.CACHE_KEY, data, ttl ?? 300);
      this.lastKnownRates = data;

      return data;
    } catch (err) {
      this.logger.error('FX API fetch failed', err);

      // Return last known rates if available
      if (this.lastKnownRates) {
        this.logger.warn('Using stale FX rates as fallback');
        return this.lastKnownRates;
      }

      throw new ServiceUnavailableException('FX rates unavailable');
    }
  }
}
