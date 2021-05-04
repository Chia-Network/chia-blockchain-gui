import React, { ReactNode, ReactElement, useState } from 'react';
import { Trans } from '@lingui/macro';
import styled from 'styled-components';
import { Flex, IconButton, TooltipIcon } from '@chia/core';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@material-ui/icons';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TypographyProps,
  CircularProgress,
} from '@material-ui/core';

const StyledCard = styled(Card)`
  height: 100%;
`;

type Props = {
  title: ReactNode;
  value: ReactNode;
  valueColor?: TypographyProps['color'];
  description?: ReactNode;
  loading?: boolean;
  tooltip?: ReactElement<any>;
  hideable?: boolean;
};

export default function FarmCard(props: Props) {
  const { title, value, description, valueColor, loading, tooltip, hideable } = props;

  const [ hidden, setHidden ] = useState(false);

  return (
    <StyledCard>
      <CardContent>
        <Flex gap={1} alignItems="center">
          <Typography color="textSecondary" gutterBottom>
            {title}
          </Typography>
          {tooltip && <TooltipIcon>{tooltip}</TooltipIcon>}
          {hideable && (
            hidden ? (
              <IconButton
                edge="end"
                aria-label="show"
                onClick={() => setHidden(!hidden)}
              >
                <VisibilityIcon />
              </IconButton>
            ) : (
              <IconButton
                edge="end"
                aria-label="hide"
                onClick={() => setHidden(!hidden)}
              >
                <VisibilityOffIcon />
              </IconButton>
            )
          )}
        </Flex>
        {loading ? (
          <Box>
            <CircularProgress color="primary" size={25} />
          </Box>
        ) : hidden ? (
          <Typography variant="h5" color="textSecondary">
            <Trans>Hidden</Trans>
          </Typography>
        ) : (
          <Typography variant="h5" color={valueColor}>
            {value}
          </Typography>
        )}

        {description && (
          <Typography variant="caption" color="textSecondary">
            {description}
          </Typography>
        )}
      </CardContent>
    </StyledCard>
  );
}

FarmCard.defaultProps = {
  valueColor: 'primary',
  description: undefined,
  loading: false,
  hideable: false,
};
