import React, { useState } from 'react';
import { Trans } from '@lingui/macro';
import { Flex, Tooltip } from '@chia/core';
import { useGetHarvesterQuery } from '@chia/api-react';
import { Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Accordion, AccordionSummary, AccordionDetails, Tab, Tabs } from '@mui/material';
import PlotHarvesterPlots from './PlotHarvesterPlots';
import PlotHarvesterPlotsNotFound from './PlotHarvesterPlotsNotFound';
import PlotHarvesterPlotsFailed from './PlotHarvesterPlotsFailed';

export type PlotHarvesterProps = {
  peerId: string;
  host: string;
  port: string;
};

export default function PlotHarvester(props: PlotHarvesterProps) {
  const { peerId, host, port } = props;

  const { plots, noKeyFilenames, failedToOpenFilenames } = useGetHarvesterQuery({
    peerId,
  });

  const [activeTab, setActiveTab] = useState<'PLOTS' | 'NOT_FOUND' | 'FAILED'>('PLOTS');
  const [expanded, setExpanded] = useState<boolean>(true);
  const simplePeerId = `${peerId.substr(0, 6)}...${peerId.substr(peerId.length - 6)}`;

  return (
    <Flex flexDirection="column" width="100%">
      <Flex justifyContent="space-between" width="100%">
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
        <Tabs
          value={activeTab}
          onChange={(_event, newValue) => setActiveTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab value="PLOTS" label={<Trans>Plots ({plots})</Trans>} />
          <Tab value="NOT_FOUND" label={<Trans>Not Found ({noKeyFilenames})</Trans>} />
          <Tab value="FAILED" label={<Trans>Failed ({failedToOpenFilenames})</Trans>} />
        </Tabs>
      </Flex>

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
    </Flex>
  );

  return (
    <Box width="100%">
      <Accordion expanded={expanded} onChange={(_event, newExpanded) => setExpanded(newExpanded)} disableGutters>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Flex justifyContent="space-between" width="100%">
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
            <Tabs
              value={activeTab}
              onChange={(_event, newValue) => setActiveTab(newValue)}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab value="PLOTS" label={<Trans>Plots</Trans>} />
              <Tab value="NOT_FOUND" label={<Trans>Not Found</Trans>} />
              <Tab value="FAILED" label={<Trans>Failed</Trans>} />
            </Tabs>
          </Flex>

        </AccordionSummary>

        <AccordionDetails>
          <PlotHarvesterPlots peerId={peerId} />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
