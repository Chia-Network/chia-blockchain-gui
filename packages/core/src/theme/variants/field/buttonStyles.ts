import type { Components, Theme } from '@mui/material/styles';

type FieldButtonStyleOptions = {
  hoverBackground: string;
  outlinedHoverShadow: string;
  containedBackground: string;
  containedHoverBackground: string;
  containedShadow: string;
  containedHoverShadow: string;
};

export default function getFieldButtonStyles({
  hoverBackground,
  outlinedHoverShadow,
  containedBackground,
  containedHoverBackground,
  containedShadow,
  containedHoverShadow,
}: FieldButtonStyleOptions): NonNullable<Components<Theme>['MuiButton']>['styleOverrides'] {
  return {
    root: {
      transition:
        'background-color 160ms ease, background-image 160ms ease, box-shadow 160ms ease, transform 160ms ease',
      '&.MuiButton-text:not(.Mui-disabled):hover, &.MuiButton-outlined:not(.Mui-disabled):hover': {
        backgroundColor: hoverBackground,
      },
      '&.MuiButton-outlined:not(.Mui-disabled):hover': {
        boxShadow: outlinedHoverShadow,
      },
      '&.MuiButton-containedPrimary:not(.Mui-disabled)': {
        backgroundImage: containedBackground,
        boxShadow: containedShadow,
      },
      '&.MuiButton-containedPrimary:not(.Mui-disabled):hover': {
        backgroundImage: containedHoverBackground,
        boxShadow: containedHoverShadow,
        transform: 'translateY(-1px)',
      },
    },
  };
}
