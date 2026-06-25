import { LoadingButton, type LoadingButtonProps } from '@mui/lab';
import React from 'react';

type ButtonLoadingColor = LoadingButtonProps['color'] | 'danger' | 'default';

export type ButtonLoadingProps = Omit<LoadingButtonProps, 'color'> & {
  color?: ButtonLoadingColor;
  loading?: boolean;
  mode?: 'autodisable' | 'hidecontent';
};
type Ref = HTMLButtonElement;

const ButtonLoading = React.forwardRef<Ref, ButtonLoadingProps>((props, ref) => {
  const { color = 'secondary', loading, onClick, ...rest } = props;

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!loading && onClick) {
      onClick(event);
    }
  }

  return (
    <LoadingButton
      onClick={handleClick}
      loading={loading}
      color={color as LoadingButtonProps['color']}
      ref={ref}
      {...rest}
    />
  );
});

export default ButtonLoading;
