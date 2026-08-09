import { api, apiServer } from "./client";
import type { PublicPlan } from "./types";

/**
 * Plan catalogue reads. `GET /plans` is a PUBLIC endpoint on the
 * backend so we can call it from either side of auth — useful for
 * pre-signup pricing pages if we build one later.
 *
 * Country is fixed to GH today (backend catalogue is per-country).
 */

export async function listPlansServer(
  accessToken: string | null,
  country: string = "GH",
): Promise<PublicPlan[]> {
  return apiServer<PublicPlan[]>(accessToken, "/plans", {
    query: { country },
  });
}

export async function listPlans(country: string = "GH"): Promise<PublicPlan[]> {
  return api<PublicPlan[]>("/plans", { query: { country } });
}
