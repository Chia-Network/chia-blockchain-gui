import type { NFTAttribute } from '@chia-network/api';
import { CopyToClipboard, Flex, Tooltip } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Box, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import isRankingAttribute from '../../util/isRankingAttribute';

/* ========================================================================== */

const StyledTitle = styled(Box)`
  font-size: 0.625rem;
  color: rgba(255, 255, 255, 0.7);
`;

const StyledValue = styled(Box)`
  word-break: break-all;
`;

/* ========================================================================== */

export type NFTPropertyProps = {
  attribute: NFTAttribute;
  size?: 'small' | 'regular';
  color?: 'primary' | 'secondary';
};

export type NFTPropertiesProps = {
  attributes?: NFTAttribute[];
};

export function NFTProperty(props: NFTPropertyProps) {
  const { attribute, size = 'regular', color = 'secondary' } = props;
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Comes from API like this
  const { name, trait_type, value } = attribute;
  const title = trait_type ?? name;
  const borderStyle = {
    border: 1,
    borderRadius: 1,
    borderColor: `${theme.palette[color].main}`,
    p: size === 'small' ? 1 : 2,
  };

  return (
    <Grid xs={12} sm={6} item>
      <Box {...borderStyle}>
        <Typography variant={size === 'small' ? 'caption' : 'body1'} color={color} noWrap>
          {title}
        </Typography>
        {/* <Tooltip title={value} copyToClipboard={true}> */}
        <Tooltip
          title={
            <Flex flexDirection="column" gap={1}>
              <Flex flexDirection="column" gap={0}>
                <Flex>
                  <Box flexGrow={1}>
                    <StyledTitle>{title}</StyledTitle>
                  </Box>
                </Flex>
                <Flex alignItems="center" gap={1}>
                  <StyledValue>{value}</StyledValue>
                  <CopyToClipboard value={value} fontSize="small" invertColor />
                </Flex>
              </Flex>
            </Flex>
          }
        >
          <Typography variant={size === 'small' ? 'body2' : 'h6'} color={color} noWrap>
            {value}
          </Typography>
        </Tooltip>
      </Box>
    </Grid>
  );
}

export default function NFTProperties(props: NFTPropertiesProps) {
  const { attributes } = props;

  const valueAttributes = useMemo(() => {
    if (Array.isArray(attributes)) {
      return attributes.filter((attribute) => !isRankingAttribute(attribute));
    }
    return [];
  }, [attributes]);

  if (!valueAttributes?.length) {
    return null;
  }

  return (
    <Flex flexDirection="column" gap={1}>
      <Typography variant="h6">
        <Trans>Properties</Trans>
      </Typography>
      <Grid spacing={2} container>
        {valueAttributes.map((attribute) => (
          <React.Fragment key={JSON.stringify(attribute)}>
            <NFTProperty attribute={attribute} />
          </React.Fragment>
        ))}
      </Grid>
    </Flex>
  );
}
