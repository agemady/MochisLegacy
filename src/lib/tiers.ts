import type { RosterTier } from '../data/roster'

/**
 * Tier progression rules (pure functions, no IO). Roster tier ladder:
 * gaggle -> candidate -> therapy. All thresholds live in TierRules so the
 * founder can tune them without touching logic.
 */

export type TierRules = {
  /** Minimum attended walks for gaggle -> candidate. */
  minWalks: number
  /** Minimum age in months for gaggle -> candidate. */
  minAgeMonths: number
}

export const DEFAULT_TIER_RULES: TierRules = {
  minWalks: 3,
  minAgeMonths: 12,
}

/** The dog facts tier progression depends on. */
export type TierDog = {
  tier: RosterTier
  walksAttended: number
  ageMonths: number
  biteHistory: boolean
  certificationOnFile: boolean
}

export type Eligibility = {
  eligible: boolean
  /** Stable reason codes for each unmet requirement; empty when eligible. */
  missing: string[]
}

const NEXT_TIER: Record<Exclude<RosterTier, 'therapy'>, RosterTier> = {
  gaggle: 'candidate',
  candidate: 'therapy',
}

/** Stable reason codes (mirrors the welfare.ts reasons style). */
export const MISSING_REASONS = {
  walks: 'too few walks attended',
  age: 'under age minimum',
  bites: 'bite history on record',
  certification: 'no certification on file',
  top: 'already at highest tier',
} as const

export function nextTierEligibility(dog: TierDog, rules: TierRules = DEFAULT_TIER_RULES): Eligibility {
  if (dog.tier === 'therapy') return { eligible: false, missing: [MISSING_REASONS.top] }
  if (dog.tier === 'gaggle') {
    const missing: string[] = []
    if (dog.walksAttended < rules.minWalks) missing.push(MISSING_REASONS.walks)
    if (dog.ageMonths < rules.minAgeMonths) missing.push(MISSING_REASONS.age)
    if (dog.biteHistory) missing.push(MISSING_REASONS.bites)
    return { eligible: missing.length === 0, missing }
  }
  // candidate -> therapy: certification is the only gate.
  return dog.certificationOnFile
    ? { eligible: true, missing: [] }
    : { eligible: false, missing: [MISSING_REASONS.certification] }
}

/** The tier a dog would advance to, or null if already at the top. */
export function nextTier(dog: TierDog): RosterTier | null {
  return dog.tier === 'therapy' ? null : NEXT_TIER[dog.tier]
}
