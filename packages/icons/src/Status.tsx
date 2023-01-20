import { FiberManualRecord as FiberManualRecordIcon } from '@mui/icons-material';
import React, { forwardRef } from 'react';
import styled from 'styled-components';

const StyledFiberManualRecordIcon = styled(({ color, ...rest }) => <FiberManualRecordIcon {...rest} />)`
  font-size: 1rem;
  color: ${({ color }) => color};
`;

type Props = {
  color: string;
};

function Status(props: Props, ref) {
  const { color } = props;

  return (
    <div ref={ref}>
      <StyledFiberManualRecordIcon color={color} />
    </div>
  );
}

export default forwardRef(Status);
