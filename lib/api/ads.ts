import { ENV } from "../env";

export interface WebAdPlacementConfig {
  slotId: string;
  afterBlock?: number;
}

export interface WebAdsConfig {
  enabled: boolean;
  publisherId: string | null;
  placements: Record<string, WebAdPlacementConfig>;
}

const DISABLED: WebAdsConfig = {
  enabled: false,
  publisherId: null,
  placements: {},
};

/**
 * Website ad placements, admin-controlled (backend `web_ads` config).
 * Public endpoint — blog readers are anonymous. Server-side fetch with
 * a 5-minute ISR window; the backend caches 60s and invalidates on
 * admin save, so a placement toggle reaches readers within minutes,
 * no deploy. Any failure = no ads: an ad must never break a page.
 */
export async function getWebAdsConfig(): Promise<WebAdsConfig> {
  try {
    const base = ENV.API_URL.replace(/\/+$/, "");
    const res = await fetch(`${base}/ads/web-config`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return DISABLED;
    const json = (await res.json()) as { data?: WebAdsConfig };
    const cfg = json.data ?? (json as unknown as WebAdsConfig);
    if (!cfg || cfg.enabled !== true || !cfg.publisherId) return DISABLED;
    return { ...cfg, placements: cfg.placements ?? {} };
  } catch {
    return DISABLED;
  }
}
