import { Palette, THEME_ORDER, THEME_REGISTRY } from './theme';

describe('THEME_REGISTRY', () => {
  const expectedKeys = Object.keys(THEME_REGISTRY.default.colors.dark).sort() as (keyof Palette)[];

  it('defines both light and dark palettes for every theme', () => {
    for (const id of THEME_ORDER) {
      const def = THEME_REGISTRY[id];
      expect(def.colors.light).toBeDefined();
      expect(def.colors.dark).toBeDefined();
    }
  });

  it('gives every theme/mode palette exactly the same set of keys', () => {
    for (const id of THEME_ORDER) {
      const def = THEME_REGISTRY[id];
      expect(Object.keys(def.colors.light).sort()).toEqual(expectedKeys);
      expect(Object.keys(def.colors.dark).sort()).toEqual(expectedKeys);
    }
  });

  it('fills every palette key with a non-empty color string', () => {
    for (const id of THEME_ORDER) {
      const def = THEME_REGISTRY[id];
      for (const scheme of ['light', 'dark'] as const) {
        const palette = def.colors[scheme];
        for (const key of expectedKeys) {
          expect(typeof palette[key]).toBe('string');
          expect(palette[key].length).toBeGreaterThan(0);
        }
      }
    }
  });
});
