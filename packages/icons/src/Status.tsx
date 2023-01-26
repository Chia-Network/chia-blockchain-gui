import { FiberManualRecord as FiberManualRecordIcon } from '@mui/icons-material';
import { styled } from '@mui/material';
import React, { forwardRef } from 'react';

const StyledFiberManualRecordIcon = styled(({ color, ...rest }: Props) => <FiberManualRecordIcon {...rest} />)`
  font-size: 1rem;
  color: ${({ color }) => color};
`;

type Props = {
  color: string;
};

const Status = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { color } = props;

  return (
    <div ref={ref}>
      <StyledFiberManualRecordIcon color={color} />
    </div>
  );
});

export default Status;
