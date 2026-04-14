import { useCallback } from 'react';

/**
 * Smart popunder hook — fires the redirect ad on high-value clicks.
 * Max 2 fires per session (resets on tab close via sessionStorage).
 *
 * Returns `triggerPopunder()` which returns `true` if the ad was fired,
 * `false` if the limit was already hit. Callers use this to know
 * whether to delay their action (so the ad opens first).
 */

const STORAGE_KEY = 'dm_popunder_count';
const MAX_FIRES = 2;

const getFireCount = () => {
  try {
    return parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10);
  } catch {
    return 0;
  }
};

const incrementFireCount = () => {
  try {
    const current = getFireCount();
    sessionStorage.setItem(STORAGE_KEY, String(current + 1));
  } catch {
    // sessionStorage not available
  }
};

const usePopunder = () => {
  const triggerPopunder = useCallback(() => {
    const count = getFireCount();

    // Already hit the limit — no redirect, tell caller to proceed instantly
    if (count >= MAX_FIRES) return false;

    incrementFireCount();

    // Load the popunder script — it fires on the current interaction
    const script = document.createElement('script');
    script.src = 'https://pl29148132.profitablecpmratenetwork.com/c9/c5/84/c9c584d6ca0b797981eb0a74121ed640.js';
    script.async = true;
    document.body.appendChild(script);

    return true; // ad was fired — caller should delay their action
  }, []);

  return triggerPopunder;
};

export default usePopunder;
