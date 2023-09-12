import { useLocalStorage } from '@chia-network/api-react';
import { Button, Color, Flex, Form, TextField } from '@chia-network/core';
import { useIsWalletSynced } from '@chia-network/wallets';
import { Trans } from '@lingui/macro';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertTitle,
  Badge,
  Grid,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';

import useOfferExpirationDefaultTime, {
  getOfferExpirationTimeInSeconds,
} from '../../hooks/useOfferExpirationDefaultTime';
import OfferBuilderExpirationCountdown from './OfferBuilderExpirationCountdown';

export type OfferExpirationSectionProps = {
  isViewing: boolean;
  canCounter: boolean;
  currentTime: number;
  expirationTime: number;
  onSubmit: (values: SetExpirationData) => Promise<void>;
  isGetHeightInfoLoading?: boolean;
  isGetTimestampForHeightLoading?: boolean;
};

type SetExpirationData = {
  days: string | number;
  hours: string | number;
  minutes: string | number;
};

const fields = [
  { name: 'days', label: 'Days', max: 365 },
  { name: 'hours', label: 'Hours', max: 24 },
  { name: 'minutes', label: 'Minutes', max: 60 },
];

export default function OfferBuilderExpirationSection(props: OfferExpirationProps) {
  const theme = useTheme();
  const {
    isViewing,
    canCounter,
    currentTime,
    expirationTime,
    onSubmit,
    isGetHeightInfoLoading,
    isGetTimestampForHeightLoading,
  } = props;
  const { offerExpirationDefaultTime, isOfferExpirationDefaultTimeEnabled } = useOfferExpirationDefaultTime();
  const isWalletSynced = useIsWalletSynced();

  const defaults = { ...offerExpirationDefaultTime };
  defaults.days = isOfferExpirationDefaultTimeEnabled ? defaults.days : 0;
  defaults.hours = isOfferExpirationDefaultTimeEnabled ? defaults.hours : 0;
  defaults.minutes = isOfferExpirationDefaultTimeEnabled ? defaults.minutes : 0;

  const methods = useForm<SetExpirationData>({
    defaultValues: {
      ...defaults,
    },
  });

  const [wasOfferExpirationVisited, setWasOfferExpirationVisited] = useLocalStorage<boolean>(
    'newFlag--wasOfferExpirationVisited',
    false
  );

  const expirationValues = useWatch({
    control: methods.control,
    name: ['days', 'hours', 'minutes'],
  });

  const willExpirationBeEnabled = expirationValues.map((value) => Number(value)).some((value) => value > 0);
  const [isExpirationExpanded, setIsExpirationExpanded] = React.useState<boolean>(willExpirationBeEnabled);

  const isExpired = expirationTime < currentTime;

  function setExpirationTime() {
    const formatTime = { days: expirationValues[0], hours: expirationValues[1], minutes: expirationValues[2] };
    const timeInSeconds = getOfferExpirationTimeInSeconds(formatTime);
    onSubmit(timeInSeconds);
  }

  function viewSection() {
    const countdownDisplay =
      !isGetHeightInfoLoading && !isGetTimestampForHeightLoading && isWalletSynced && currentTime !== -20
        ? OfferBuilderExpirationCountdown(currentTime, expirationTime, false)
        : 'Loading expiration time...';
    return (
      <Grid xs={12} item>
        {isExpired ? (
          <Alert severity="error">Offer has expired and cannot be accepted.</Alert>
        ) : (
          <Alert severity="warning">{countdownDisplay}</Alert>
        )}
      </Grid>
    );
  }

  function editSection() {
    return (
      <Form methods={methods} key={0} onSubmit={onSubmit}>
        <Grid xs={12} item border={1} borderColor={theme.palette.border.main} borderRadius={1}>
          <Accordion
            expanded={isExpirationExpanded}
            onChange={(_event, isExpanded: boolean) => {
              if (!wasOfferExpirationVisited) {
                setWasOfferExpirationVisited(true);
              }
              setIsExpirationExpanded(isExpanded);
            }}
            sx={{ boxShadow: 'none' }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon color="info" />}
              aria-controls="panel2bh-content"
              id="panel2bh-header"
            >
              <Badge
                badgeContent="New"
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    top: '10px',
                    right: '-25px',
                  },
                }}
                invisible={wasOfferExpirationVisited}
              >
                <Typography variant="subtitle2">
                  <Trans>Add option to set expiration time {canCounter ? ' to counteroffer' : null}</Trans>
                </Typography>
              </Badge>
            </AccordionSummary>
            <AccordionDetails>
              <Alert
                severity="info"
                sx={{
                  marginBottom: 3,
                  backgroundColor: theme.palette.mode === 'light' ? Color.Neutral[200] : Color.Neutral[700],
                }}
              >
                <Trans>
                  - Set a time after which the offer expires.
                  <br />- An expiring offer can only be claimed prior to the expiration time.
                </Trans>
              </Alert>
              <Flex gap={2}>
                {fields.map((field) => (
                  <TextField
                    name={field.name}
                    key={field.name}
                    label={field.label}
                    type="number"
                    size="small"
                    InputProps={{
                      inputProps: {
                        min: 0,
                        step: 1,
                        max: field.max,
                      },
                    }}
                    data-testid={`WalletSend-${field.name}`}
                    sx={{ width: 100 }}
                    onChange={setExpirationTime()}
                  />
                ))}
                {willExpirationBeEnabled && (
                  <Button
                    variant="outlined"
                    type="submit"
                    onClick={() => {
                      methods.setValue('days', 0);
                      methods.setValue('hours', 0);
                      methods.setValue('minutes', 0);
                    }}
                  >
                    <Trans>Disable</Trans>
                  </Button>
                )}
              </Flex>
              {willExpirationBeEnabled && (
                <Alert severity="info" sx={{ marginTop: 3 }} icon={<ReportProblemOutlinedIcon />}>
                  <AlertTitle>
                    <Trans>
                      Expiration time will be {isViewing && canCounter ? 'applied to counteroffer.' : 'applied.'}
                    </Trans>
                  </AlertTitle>
                </Alert>
              )}
              {!willExpirationBeEnabled && (
                <Typography component="div" variant="subtitle2" sx={{ width: '100%', marginTop: 3 }}>
                  <Trans>This offer will never expire. </Trans>{' '}
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Form>
    );
  }

  return (
    <Flex flexDirection="column" gap={3}>
      {isViewing && viewSection()}
      {isViewing && canCounter && editSection()}
      {!isViewing && editSection()}
    </Flex>
  );
}
