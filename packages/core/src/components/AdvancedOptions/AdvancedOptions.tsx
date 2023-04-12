import { Trans } from '@lingui/macro';
import {
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { Typography } from '@mui/material';
import React, { ReactNode } from 'react';
import { useToggle } from 'react-use';

import Accordion from '../Accordion';
import Flex from '../Flex';

type Props = {
  children?: ReactNode;
  expanded: boolean;
  hideExpanded?: boolean;
  moreTitle?: ReactNode;
  lessTitle?: ReactNode;
};

export default function AdvancedOptions(props: Props) {
  const {
    children,
    expanded: defaultExpanded = false,
    hideExpanded = false,
    moreTitle = <Trans>Show Advanced Options</Trans>,
    lessTitle = <Trans>Hide Advanced Options</Trans>,
  } = props;
  const [isExpanded, setIsExpanded] = useToggle(defaultExpanded);

  const hideTitle = hideExpanded && isExpanded;

  function handleToggle() {
    setIsExpanded(!isExpanded);
  }

  return (
    <Flex flexDirection="column" gap={1}>
      {!hideTitle && (
        <Typography variant="caption" onClick={handleToggle} sx={{ cursor: 'pointer' }}>
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
        </Typography>
      )}

      <Accordion expanded={isExpanded}>{children}</Accordion>
    </Flex>
  );
}
