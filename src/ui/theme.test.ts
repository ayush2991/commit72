import { Palette, palettes, THEME_REGISTRY, ThemeId } from './theme';

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
 * Every ThemeId's resolved palette, including 'default' under both possible
 * OS schemes — mirrors what useTheme() can actually produce at runtime,
 * since 'default' has no fixed palette and instead follows the OS scheme.
 */
function resolvedPalettes(): Array<{ name: string; colors: Palette }> {
  const entries: Array<{ name: string; colors: Palette }> = [];
  for (const id of Object.keys(THEME_REGISTRY) as ThemeId[]) {
    const def = THEME_REGISTRY[id];
    if (def.colors) {
      entries.push({ name: id, colors: def.colors });
    } else {
      entries.push({ name: `${id}-dark`, colors: palettes.dark });
      entries.push({ name: `${id}-light`, colors: palettes.light });
    }
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
