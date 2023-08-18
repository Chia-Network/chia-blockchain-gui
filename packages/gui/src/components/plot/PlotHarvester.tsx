import { useGetHarvesterQuery } from '@chia-network/api-react';
import { Accordion, Flex, FormatBytes, Tooltip, FormatLargeNumber } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { Typography, Chip, Box, Tab, Tabs } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useToggle } from 'react-use';

import isLocalhost from '../../util/isLocalhost';
import PlotHarvesterPlots from './PlotHarvesterPlots';
import PlotHarvesterPlotsDuplicate from './PlotHarvesterPlotsDuplicate';
import PlotHarvesterPlotsFailed from './PlotHarvesterPlotsFailed';
import PlotHarvesterPlotsNotFound from './PlotHarvesterPlotsNotFound';
import PlotHarvesterState from './PlotHarvesterState';

export type PlotHarvesterProps = {
  nodeId: string;
  host: string;
  expanded?: boolean;
};

export default function PlotHarvester(props: PlotHarvesterProps) {
  const { nodeId, host, expanded: expandedDefault = false } = props;

  const { plots, noKeyFilenames, failedToOpenFilenames, duplicates, totalPlotSize, initialized } = useGetHarvesterQuery(
    {
      nodeId,
    }
  );

  const [activeTab, setActiveTab] = useState<'PLOTS' | 'NOT_FOUND' | 'FAILED' | 'DUPLICATE'>('PLOTS');
  const [expanded, toggleExpand] = useToggle(expandedDefault);
  const simpleNodeId = `${nodeId.substr(0, 6)}...${nodeId.substr(nodeId.length - 6)}`;
  const isLocal = isLocalhost(host);

  useEffect(() => {
    if (
      (activeTab === 'NOT_FOUND' && !noKeyFilenames) ||
      (activeTab === 'FAILED' && !failedToOpenFilenames) ||
      (activeTab === 'DUPLICATE' && !duplicates)
    ) {
      setActiveTab('PLOTS');
    }
  }, [activeTab, plots, noKeyFilenames, failedToOpenFilenames, duplicates]);

  function handleChangeActiveTab(newActiveTab) {
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
              <Typography>{isLocal ? <Trans>Local</Trans> : <Trans>Remote</Trans>}</Typography>
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
            onChange={(_event, newValue) => handleChangeActiveTab(newValue)}
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              value="PLOTS"
              label={
                <Flex alignItems="center" gap={1}>
                  <Box>
                    <Trans>Plots</Trans>
                  </Box>
                  {initialized && <Chip label={<FormatLargeNumber value={plots} />} size="extraSmall" />}
                </Flex>
              }
            />
            {!!noKeyFilenames && (
              <Tab
                value="NOT_FOUND"
                label={
                  <Flex alignItems="center" gap={1}>
                    <Box>
                      <Trans>Missing Keys</Trans>
                    </Box>
                    {initialized && <Chip label={<FormatLargeNumber value={noKeyFilenames} />} size="extraSmall" />}
                  </Flex>
                }
              />
            )}
            {!!failedToOpenFilenames && (
              <Tab
                value="FAILED"
                label={
                  <Flex alignItems="center" gap={1}>
                    <Box>
                      <Trans>Failed</Trans>
                    </Box>
                    {initialized && (
                      <Chip label={<FormatLargeNumber value={failedToOpenFilenames} />} size="extraSmall" />
                    )}
                  </Flex>
                }
              />
            )}
            {!!duplicates && (
              <Tab
                value="DUPLICATE"
                label={
                  <Flex alignItems="center" gap={1}>
                    <Box>
                      <Trans>Duplicate</Trans>
                    </Box>
                    {initialized && <Chip label={<FormatLargeNumber value={duplicates} />} size="extraSmall" />}
                  </Flex>
                }
              />
            )}
          </Tabs>
          &nbsp;
          {expanded ? (
            <ExpandLess onClick={toggleExpand} color="info" />
          ) : (
            <ExpandMore onClick={toggleExpand} color="info" />
          )}
        </Flex>
      </Flex>

      <Accordion expanded={expanded}>
        <Box height={16} />
        <Box display={activeTab === 'PLOTS' ? 'block' : 'none'}>
          <PlotHarvesterPlots nodeId={nodeId} />
        </Box>
        <Box display={activeTab === 'NOT_FOUND' ? 'block' : 'none'}>
          <PlotHarvesterPlotsNotFound nodeId={nodeId} />
        </Box>
        <Box display={activeTab === 'FAILED' ? 'block' : 'none'}>
          <PlotHarvesterPlotsFailed nodeId={nodeId} />
        </Box>
        <Box display={activeTab === 'DUPLICATE' ? 'block' : 'none'}>
          <PlotHarvesterPlotsDuplicate nodeId={nodeId} />
        </Box>
      </Accordion>
    </Flex>
  );
}
