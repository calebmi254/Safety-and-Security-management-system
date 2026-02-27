/**
 * Severity Mapper — Shared Utility
 *
 * This is the SINGLE source of truth for severity scoring across all
 * data sources. Both GDELT and ACLED (and any future source) must call
 * these functions rather than implementing their own scoring logic.
 *
 * Severity Scale (SecureX Internal):
 *   1 = Low     — minor incident, limited impact
 *   2 = Medium  — notable incident, localised impact
 *   3 = High    — significant incident, regional impact
 *   4 = Severe  — major incident, wide impact
 *   5 = Critical — extreme incident, national/international impact
 */

/**
 * Maps a GDELT Goldstein Scale value to a 1–5 severity score.
 * Goldstein Scale: -10 (most destabilizing) to +10 (most stabilizing).
 * We only care about negative values — negative = destabilizing events.
 *
 * @param {number|string} goldstein - Goldstein scale value from GDELT
 * @returns {number} severity score between 1 and 5
 */
function calculateSeverityFromGoldstein(goldstein) {
    const score = parseFloat(goldstein);

    // Guard: invalid or positive (stabilizing) events get lowest severity
    if (isNaN(score) || score > 0) return 1;

    if (score <= -8.0) return 5; // Critical: extreme violence
    if (score <= -6.0) return 4; // Severe: major armed conflict
    if (score <= -4.0) return 3; // High: significant unrest
    if (score <= -2.0) return 2; // Medium: minor violence or protest
    return 1;                    // Low: minimal destabilization
}

/**
 * Maps ACLED fatality count to a 1–5 severity score.
 * To be refined once ACLED adapter is built (Phase 2).
 *
 * @param {number|string} fatalities - number of fatalities from ACLED
 * @returns {number} severity score between 1 and 5
 */
function calculateSeverityFromFatalities(fatalities) {
    const count = parseInt(fatalities, 10);

    if (isNaN(count) || count <= 0) return 1; // No fatalities = Low
    if (count >= 50) return 5;  // Critical
    if (count >= 20) return 4;  // Severe
    if (count >= 5) return 3;  // High
    if (count >= 1) return 2;  // Medium
    return 1;
}

/**
 * Maps a DOC 2.0 article tone score to a 1–5 severity score.
 * GDELT tone ranges from -100 (most negative) to +100 (most positive).
 * Used when ingesting article-level data rather than event-level data.
 *
 * @param {number|string} tone - article tone score from GDELT DOC 2.0
 * @returns {number} severity score between 1 and 5
 */
function calculateSeverityFromTone(tone) {
    const score = parseFloat(tone);

    if (isNaN(score) || score > 0) return 1;

    if (score <= -20) return 5;
    if (score <= -12) return 4;
    if (score <= -7) return 3;
    if (score <= -3) return 2;
    return 1;
}

module.exports = {
    calculateSeverityFromGoldstein,
    calculateSeverityFromFatalities,
    calculateSeverityFromTone,
};
