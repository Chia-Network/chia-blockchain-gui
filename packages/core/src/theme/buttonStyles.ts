import type { Components, Theme } from '@mui/material/styles';

type ButtonStyleOptions = {
  borderRadius?: number;
  fontWeight?: number;
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
  hoverBackground?: string;
  hoverShadow?: string;
  hoverTransform?: string;
  outlinedHoverShadow?: string;
  containedBackground?: string;
  containedHoverBackground?: string;
  containedShadow?: string;
  containedHoverShadow?: string;
};

export default function getButtonStyles({
  borderRadius,
  fontWeight,
  textTransform,
  hoverBackground,
  hoverShadow,
  hoverTransform,
  outlinedHoverShadow,
  containedBackground,
  containedHoverBackground,
  containedShadow,
  containedHoverShadow,
}: ButtonStyleOptions): NonNullable<Components<Theme>['MuiButton']>['styleOverrides'] {
  return {
    root: {
      borderRadius,
      fontWeight,
      textTransform,
      transition:
        'background-color 160ms ease, background-image 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
      '&:not(.Mui-disabled):hover': {
        boxShadow: hoverShadow,
        transform: hoverTransform,
      },
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
      },
    },
  };
}
