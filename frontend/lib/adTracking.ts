"use client";

const STORAGE_KEY = "capitalLabAdTracking";
const TRACKED_PARAMS = ["gad_source", "gad_campaignid", "gbraid", "gclid"] as const;

export interface AdTrackingParams {
  gad_source?: string;
  gad_campaignid?: string;
  gbraid?: string;
  gclid?: string;
}

/** Reads Google Ads click-id params from the URL (if present) and persists them
 * for the tab session, so they're still available if the user submits a form
 * after navigating around the site. Safe to call on every page/form mount. */
export function captureAdTrackingParams() {
  if (typeof window === "undefined") return;

  const searchParams = new URLSearchParams(window.location.search);
  const found: AdTrackingParams = {};
  let hasAny = false;

  for (const key of TRACKED_PARAMS) {
    const value = searchParams.get(key);
    if (value) {
      found[key] = value;
      hasAny = true;
    }
  }

  if (hasAny) {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(found));
  }
}

export function getAdTrackingParams(): AdTrackingParams {
  if (typeof window === "undefined") return {};

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
