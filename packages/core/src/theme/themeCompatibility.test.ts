import getColorModeValue from '../utils/useColorModeValue';

import deprecatedDark from './dark';
import deprecatedLight from './light';
import chiaDark from './variants/chia/dark';
import chiaLight from './variants/chia/light';
import classicDark from './variants/classic/dark';
import classicLight from './variants/classic/light';
import fieldDark from './variants/field/dark';
import fieldLight from './variants/field/light';

function resolveSelectedFill(theme: Parameters<typeof getColorModeValue>[0]): string {
  if (theme.palette.sidebarSelectedFill) {
    return getColorModeValue(theme, 'sidebarSelectedFill' as Parameters<typeof getColorModeValue>[1]);
  }
  return '';
}

describe('theme compatibility', () => {
  test('deprecated light/dark entry points re-export the original classic palette', () => {
    expect(deprecatedLight).toBe(classicLight);
    expect(deprecatedDark).toBe(classicDark);
  });

  test.each([
    ['chia light', chiaLight],
    ['chia dark', chiaDark],
    ['classic light', classicLight],
    ['classic dark', classicDark],
    ['field light', fieldLight],
    ['field dark', fieldDark],
  ])('%s sidebarBackground is a CSS color string', (_label, theme) => {
    expect(typeof theme.palette.sidebarBackground).toBe('string');
    expect(theme.palette.sidebarBackground).toBeTruthy();
  });

  test.each([
    ['chia light', chiaLight],
    ['chia dark', chiaDark],
    ['classic light', classicLight],
    ['classic dark', classicDark],
    ['field light', fieldLight],
    ['field dark', fieldDark],
  ])('%s selected fill is distinct from the drawer background', (_label, theme) => {
    const fill = resolveSelectedFill(theme);
    const drawer = getColorModeValue(theme, 'sidebarBackground' as Parameters<typeof getColorModeValue>[1]);

    expect(fill).toBeTruthy();
    expect(fill).not.toBe(drawer);
  });
});
