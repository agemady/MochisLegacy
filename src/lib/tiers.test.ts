import { describe, expect, it } from 'vitest'
import { DEFAULT_TIER_RULES, MISSING_REASONS, nextTier, nextTierEligibility, type TierDog } from './tiers'

function dog(over: Partial<TierDog> = {}): TierDog {
  return {
    tier: 'gaggle',
    walksAttended: 3,
    ageMonths: 24,
    biteHistory: false,
    certificationOnFile: false,
    ...over,
  }
}

describe('nextTierEligibility — gaggle to candidate', () => {
  it('is eligible when walks, age, and bite rules are all met', () => {
    expect(nextTierEligibility(dog())).toEqual({ eligible: true, missing: [] })
  })

  it('flags too few walks against the rules minimum (default 3)', () => {
    const r = nextTierEligibility(dog({ walksAttended: 2 }))
    expect(r.eligible).toBe(false)
    expect(r.missing).toEqual([MISSING_REASONS.walks])
  })

  it('honors a custom rules.minWalks', () => {
    const r = nextTierEligibility(dog({ walksAttended: 4 }), { ...DEFAULT_TIER_RULES, minWalks: 5 })
    expect(r.missing).toContain(MISSING_REASONS.walks)
    expect(nextTierEligibility(dog({ walksAttended: 5 }), { ...DEFAULT_TIER_RULES, minWalks: 5 }).eligible).toBe(true)
  })

  it('flags dogs under the age minimum (default 12 months)', () => {
    expect(nextTierEligibility(dog({ ageMonths: 11 })).missing).toEqual([MISSING_REASONS.age])
    expect(nextTierEligibility(dog({ ageMonths: 12 })).eligible).toBe(true)
  })

  it('flags bite history', () => {
    expect(nextTierEligibility(dog({ biteHistory: true })).missing).toEqual([MISSING_REASONS.bites])
  })

  it('accumulates every unmet requirement', () => {
    const r = nextTierEligibility(dog({ walksAttended: 0, ageMonths: 6, biteHistory: true }))
    expect(r.missing).toEqual([MISSING_REASONS.walks, MISSING_REASONS.age, MISSING_REASONS.bites])
  })
})

describe('nextTierEligibility — candidate to therapy', () => {
  it('is eligible once certification is on file', () => {
    expect(nextTierEligibility(dog({ tier: 'candidate', certificationOnFile: true }))).toEqual({
      eligible: true,
      missing: [],
    })
  })

  it('requires certification regardless of walks or age', () => {
    const r = nextTierEligibility(dog({ tier: 'candidate', walksAttended: 99, ageMonths: 120 }))
    expect(r.eligible).toBe(false)
    expect(r.missing).toEqual([MISSING_REASONS.certification])
  })
})

describe('nextTierEligibility — therapy dogs', () => {
  it('is never eligible and reports top of ladder', () => {
    const r = nextTierEligibility(dog({ tier: 'therapy', certificationOnFile: true }))
    expect(r.eligible).toBe(false)
    expect(r.missing).toEqual([MISSING_REASONS.top])
  })
})

describe('nextTier', () => {
  it('steps gaggle -> candidate -> therapy -> null', () => {
    expect(nextTier(dog({ tier: 'gaggle' }))).toBe('candidate')
    expect(nextTier(dog({ tier: 'candidate' }))).toBe('therapy')
    expect(nextTier(dog({ tier: 'therapy' }))).toBeNull()
  })
})
