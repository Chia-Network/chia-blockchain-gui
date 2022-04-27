import React, { useState } from 'react';
import { Trans } from '@lingui/macro';
import { useToggle } from 'react-use';
import { Accordion, Flex, Tooltip } from '@chia/core';
import { useGetHarvesterQuery } from '@chia/api-react';
import { Typography } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { Box, Tab, Tabs } from '@mui/material';
import PlotHarvesterPlots from './PlotHarvesterPlots';
import PlotHarvesterPlotsNotFound from './PlotHarvesterPlotsNotFound';
import PlotHarvesterPlotsFailed from './PlotHarvesterPlotsFailed';

export type PlotHarvesterProps = {
  peerId: string;
  host: string;
  port: string;
  expanded?: boolean;
};

export default function PlotHarvester(props: PlotHarvesterProps) {
  const { peerId, host, port, expanded: expandedDefault = false } = props;

  const { plots, noKeyFilenames, failedToOpenFilenames } = useGetHarvesterQuery({
    peerId,
  });

  const [activeTab, setActiveTab] = useState<'PLOTS' | 'NOT_FOUND' | 'FAILED'>('PLOTS');
  const [expanded, toggleExpand] = useToggle(expandedDefault);
  const simplePeerId = `${peerId.substr(0, 6)}...${peerId.substr(peerId.length - 6)}`;

  return (
    <Flex flexDirection="column" width="100%">
      <Flex justifyContent="space-between" width="100%" alignItems="center">
        <Flex flexDirection="column">
          <Flex alignItems="baseline">
            <Typography variant="h6">
              <Trans>Harvester</Trans>
            </Typography>
            &nbsp;
            <Tooltip title={peerId}>
              <Typography variant="body2" color="textSecondary">
                {simplePeerId}
              </Typography>
            </Tooltip>
          </Flex>
          <Typography variant="body2" color="textSecondary">
            {host}:{port}
          </Typography>
        </Flex>
        <Flex alignItems="center">
          <Tabs
            value={activeTab}
            onChange={(_event, newValue) => setActiveTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab value="PLOTS" label={<Trans>Plots ({plots})</Trans>} />
            <Tab value="NOT_FOUND" label={<Trans>Missing Keys ({noKeyFilenames})</Trans>} />
            <Tab value="FAILED" label={<Trans>Failed ({failedToOpenFilenames})</Trans>} />
          </Tabs>
          &nbsp;
          {expanded ? <ExpandLess onClick={toggleExpand} /> : <ExpandMore onClick={toggleExpand} />}
        </Flex>
      </Flex>

      <Accordion expanded={expanded}>
        <Box height={16} />
        <Box display={activeTab=== 'PLOTS' ? 'block' : 'none'}>
          <PlotHarvesterPlots peerId={peerId} />
        </Box>
        <Box display={activeTab=== 'NOT_FOUND' ? 'block' : 'none'}>
          <PlotHarvesterPlotsNotFound peerId={peerId} />
        </Box>
        <Box display={activeTab=== 'FAILED' ? 'block' : 'none'}>
          <PlotHarvesterPlotsFailed peerId={peerId} />
        </Box>
      </Accordion>
    </Flex>
  );
}
