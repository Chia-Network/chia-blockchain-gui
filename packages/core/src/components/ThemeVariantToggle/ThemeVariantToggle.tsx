import { ExpandMore, Palette } from '@mui/icons-material';
import { Menu, MenuItem } from '@mui/material';
import React, { useMemo } from 'react';
import { useToggle } from 'react-use';

import useThemeVariant from '../../hooks/useThemeVariant';
import { THEME_VARIANT_META, type ThemeVariantId } from '../../theme/variantTypes';
import Button from '../Button';

export default function ThemeVariantToggle(props: React.ComponentProps<typeof Button>) {
  const { ...rest } = props;
  const { themeVariant, setThemeVariant } = useThemeVariant();
  const [open, toggleOpen] = useToggle(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const currentLabel = useMemo(
    () => THEME_VARIANT_META.find((item) => item.id === themeVariant)?.label ?? themeVariant,
    [themeVariant],
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    toggleOpen();
  };

  const handleClose = () => {
    setAnchorEl(null);
    toggleOpen();
  };

  function handleSelect(variant: ThemeVariantId) {
    setThemeVariant(variant);
    handleClose();
  }

  return (
    <>
      <Button
        aria-controls="theme-variant-menu"
        aria-haspopup="true"
        onClick={handleClick}
        startIcon={<Palette />}
        endIcon={<ExpandMore />}
        data-testid="ThemeVariantToggle-dropdown"
        {...rest}
      >
        {currentLabel}
      </Button>
      <Menu id="theme-variant-menu" anchorEl={anchorEl} keepMounted open={open} onClose={handleClose}>
        {THEME_VARIANT_META.map((item) => (
          <MenuItem
            key={item.id}
            onClick={() => handleSelect(item.id)}
            selected={item.id === themeVariant}
            data-testid={`ThemeVariantToggle-variant-${item.id}`}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
