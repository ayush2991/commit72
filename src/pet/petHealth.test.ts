import { computeHealth, moodForHealth, PET_HEALTH_DEFAULT } from './petHealth';

describe('computeHealth', () => {
  it('starts at the default with no history', () => {
    expect(computeHealth(0, 0)).toBe(PET_HEALTH_DEFAULT);
  });

  it('rises when pacts are kept', () => {
    expect(computeHealth(2, 0)).toBeGreaterThan(PET_HEALTH_DEFAULT);
  });

  it('falls when pacts are broken', () => {
    expect(computeHealth(0, 2)).toBeLessThan(PET_HEALTH_DEFAULT);
  });

  it('clamps to 100', () => {
    expect(computeHealth(50, 0)).toBe(100);
  });

  it('clamps to 0', () => {
    expect(computeHealth(0, 50)).toBe(0);
  });
});

describe('moodForHealth', () => {
  it('is fading at the bottom of the range', () => {
    expect(moodForHealth(0)).toBe('fading');
  });

  it('is thriving at the top of the range', () => {
    expect(moodForHealth(100)).toBe('thriving');
  });

  it('is steady at the default health (58 falls in the 40-61 steady band)', () => {
    expect(moodForHealth(PET_HEALTH_DEFAULT)).toBe('steady');
  });
});
