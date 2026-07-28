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

const AA_NORMAL_TEXT = 4.5;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * Every ThemeId's light and dark palette, resolved directly from the
 * registry — every theme now defines both explicitly, so there's no OS-scheme
 * fallback to reproduce here (unlike when only 'default' supported dark mode).
 */
function resolvedPalettes(): Array<{ name: string; colors: Palette }> {
  const entries: Array<{ name: string; colors: Palette }> = [];
  for (const id of THEME_ORDER) {
    const def = THEME_REGISTRY[id];
    entries.push({ name: `${id}-light`, colors: def.colors.light });
    entries.push({ name: `${id}-dark`, colors: def.colors.dark });
  }
  return entries;
}

describe('theme contrast (WCAG AA, normal text, 4.5:1)', () => {
  for (const { name, colors } of resolvedPalettes()) {
    describe(name, () => {
      it('textFaint is readable against bg, bgElevated, panel, panel2', () => {
        for (const bgKey of ['bg', 'bgElevated', 'panel', 'panel2'] as const) {
          const ratio = contrastRatio(colors.textFaint, colors[bgKey]);
          expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
        }
      });

      it('textDim is readable against panel', () => {
        expect(contrastRatio(colors.textDim, colors.panel)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      });

      it('failed is readable as text against panel and failedCardBg', () => {
        expect(contrastRatio(colors.failed, colors.panel)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
        expect(contrastRatio(colors.failed, colors.failedCardBg)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      });

      it('badgeFailedText is readable against failedCardBorder', () => {
        expect(contrastRatio(colors.badgeFailedText, colors.failedCardBorder)).toBeGreaterThanOrEqual(
          AA_NORMAL_TEXT
        );
      });
    });
  }
});
