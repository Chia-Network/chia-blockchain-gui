import React, { useEffect, useState } from 'react';
import { Trans } from '@lingui/macro';
import { useToggle } from 'react-use';
import { Accordion, Flex, FormatBytes, Tooltip } from '@chia/core';
import { useGetHarvesterQuery } from '@chia/api-react';
import { Typography } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { Box, Tab, Tabs } from '@mui/material';
import PlotHarvesterPlots from './PlotHarvesterPlots';
import PlotHarvesterPlotsNotFound from './PlotHarvesterPlotsNotFound';
import PlotHarvesterPlotsFailed from './PlotHarvesterPlotsFailed';
import PlotHarvesterPlotsDuplicate from './PlotHarvesterPlotsDuplicate';
import PlotHarvesterState from './PlotHarvesterState';

export type PlotHarvesterProps = {
  nodeId: string;
  host: string;
  port: string;
  expanded?: boolean;
};

export default function PlotHarvester(props: PlotHarvesterProps) {
  const { nodeId, host, expanded: expandedDefault = false } = props;

  const { plots, noKeyFilenames, failedToOpenFilenames, duplicates, totalPlotSize, initialized } = useGetHarvesterQuery({
    nodeId,
  });

  const [activeTab, setActiveTab] = useState<'PLOTS' | 'NOT_FOUND' | 'FAILED' | 'DUPLICATE'>('FAILED');
  const [expanded, toggleExpand] = useToggle(expandedDefault);
  const simpleNodeId = `${nodeId.substr(0, 6)}...${nodeId.substr(nodeId.length - 6)}`;
  const isLocal = host === '127.0.0.1';

  useEffect(() => {
    if ((activeTab === 'NOT_FOUND' && !noKeyFilenames) || (activeTab === 'FAILED' && !failedToOpenFilenames) || (activeTab === 'DUPLICATE' && !duplicates)) {
      setActiveTab('PLOTS');
    }
  }, [activeTab, plots, noKeyFilenames, failedToOpenFilenames, duplicates]);

  function hadneChangeActiveTab(newActiveTab) {
    setActiveTab(newActiveTab);

    if (!expanded) {
      toggleExpand();
    }
  }

  return (
    <Flex flexDirection="column" width="100%">
      <Flex justifyContent="space-between" width="100%" alignItems="center">
        <Flex flexDirection="row" alignItems="center" gap={2} onClick={toggleExpand}>
          <Flex flexDirection="column">
            <Flex alignItems="baseline">
              <Typography>
                {isLocal ? <Trans>Local</Trans> : <Trans>Remote</Trans>}
              </Typography>
              &nbsp;
              <Tooltip title={nodeId}>
                <Typography variant="body2" color="textSecondary">
                  {simpleNodeId}
                </Typography>
              </Tooltip>
            </Flex>
            <Flex alignItems="center" gap={2}>
              <Typography variant="body2" color="textSecondary">
                {host}
                {initialized && (
                  <>
                    ,&nbsp;
                    <FormatBytes value={totalPlotSize} precision={3} />
                  </>
                )}
              </Typography>
              <PlotHarvesterState nodeId={nodeId} />
            </Flex>
          </Flex>
        </Flex>
        <Flex alignItems="center">
          <Tabs
            value={activeTab}
            onChange={(_event, newValue) => hadneChangeActiveTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab value="PLOTS" label={<Trans>Plots ({plots})</Trans>} />
            {!!noKeyFilenames && (
              <Tab value="NOT_FOUND" label={<Trans>Missing Keys ({noKeyFilenames})</Trans>} />
            )}
            {!!failedToOpenFilenames && (
              <Tab value="FAILED" label={<Trans>Failed ({failedToOpenFilenames})</Trans>} />
            )}
            {!!duplicates && (
              <Tab value="DUPLICATE" label={<Trans>Duplicate ({duplicates})</Trans>} />
            )}
          </Tabs>
          &nbsp;
          {expanded ? <ExpandLess onClick={toggleExpand} /> : <ExpandMore onClick={toggleExpand} />}
        </Flex>
      </Flex>

      <Accordion expanded={expanded}>
        <Box height={16} />
        <Box display={activeTab=== 'PLOTS' ? 'block' : 'none'}>
          <PlotHarvesterPlots nodeId={nodeId} />
        </Box>
        <Box display={activeTab=== 'NOT_FOUND' ? 'block' : 'none'}>
          <PlotHarvesterPlotsNotFound nodeId={nodeId} />
        </Box>
        <Box display={activeTab=== 'FAILED' ? 'block' : 'none'}>
          <PlotHarvesterPlotsFailed nodeId={nodeId} />
        </Box>
        <Box display={activeTab=== 'DUPLICATE' ? 'block' : 'none'}>
          <PlotHarvesterPlotsDuplicate nodeId={nodeId} />
        </Box>
      </Accordion>
    </Flex>
  );
}
