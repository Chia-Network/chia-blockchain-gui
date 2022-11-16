import { Trans } from '@lingui/macro';
import {
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { Typography } from '@mui/material';
import React, { ReactNode } from 'react';
import { useToggle } from 'react-use';
import styled from 'styled-components';

import Accordion from '../Accordion';
import Flex from '../Flex';

const StyledToggleAdvancedOptions = styled(({ expanded, ...rest }) => <Typography {...rest} />)`
  cursor: pointer;
`;

type Props = {
  children?: ReactNode;
  expanded: boolean;
  hideExpanded?: boolean;
  moreTitle?: ReactNode;
  lessTitle?: ReactNode;
};

export default function AdvancedOptions(props: Props) {
  const { children, expanded: defaultExpanded, hideExpanded, moreTitle, lessTitle } = props;
  const [isExpanded, setIsExpanded] = useToggle(defaultExpanded);

  const hideTitle = hideExpanded && isExpanded;

  function handleToggle() {
    setIsExpanded(!isExpanded);
  }

  return (
    <Flex flexDirection="column" gap={1}>
      {!hideTitle && (
        <StyledToggleAdvancedOptions variant="caption" expanded={isExpanded} onClick={handleToggle}>
          {isExpanded ? (
            <Flex alignItems="center">
              <KeyboardArrowUpIcon />
              {lessTitle}
            </Flex>
          ) : (
            <Flex alignItems="center">
              <KeyboardArrowDownIcon />
              {moreTitle}
            </Flex>
          )}
        </StyledToggleAdvancedOptions>
      )}

      <Accordion expanded={isExpanded}>{children}</Accordion>
    </Flex>
  );
}

AdvancedOptions.defaultProps = {
  expanded: false,
  children: undefined,
  hideExpanded: false,
  moreTitle: <Trans>Show Advanced Options</Trans>,
  lessTitle: <Trans>Hide Advanced Options</Trans>,
};
