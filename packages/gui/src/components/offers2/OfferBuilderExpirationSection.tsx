import { useLocalStorage } from '@chia-network/api-react';
import { Button, Color, Flex, Form, Link, TextField } from '@chia-network/core';
import { Hourglass as HourglassIcon } from '@chia-network/icons';
import { useIsWalletSynced } from '@chia-network/wallets';
import { plural, Trans, t } from '@lingui/macro';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Badge, Grid, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

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

function ViewTitle({ expirationValues, willExpirationBeEnabled }: any) {
  const displayDays = Number(expirationValues[0]) > 0 ? expirationValues[0] : null;
  const displayDaysText = displayDays ? plural(displayDays, { one: 'day', other: 'days' }) : null;
  const displayHours = Number(expirationValues[1]) > 0 ? expirationValues[1] : null;
  const displayHoursText = displayHours ? plural(displayHours, { one: 'hour', other: 'hours' }) : null;
  const displayMinutes = Number(expirationValues[2]) > 0 ? expirationValues[2] : null;
  const displayMinutesText = displayMinutes ? plural(displayMinutes, { one: 'minute', other: 'minutes' }) : null;
  const hoursComma = displayDays && (displayHours || displayMinutes) ? ', ' : null;
  const minutesComma = displayHours && displayMinutes ? ', ' : null;
  const displayText = willExpirationBeEnabled
    ? t`This offer will expire in ${displayDays} ${displayDaysText}${hoursComma} ${displayHours} ${displayHoursText}${minutesComma} ${displayMinutes} ${displayMinutesText}`
    : t`This offer will not expire`;
  return (
    <Flex>
      <Typography variant="subtitle2">{displayText}</Typography>
    </Flex>
  );
}

export default function OfferBuilderExpirationSection(props: OfferExpirationProps) {
  const theme = useTheme();
  const navigate = useNavigate();
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
  const [isExpirationExpanded, setIsExpirationExpanded] = React.useState<boolean>(false);

  const isExpired = expirationTime < currentTime;

  const fields = [
    { name: 'days', label: t`Days`, max: 365 },
    { name: 'hours', label: t`Hours`, max: 24 },
    { name: 'minutes', label: t`Minutes`, max: 60 },
  ];

  async function handleNavToSettings() {
    navigate('/dashboard/settings/general');
  }

  function setExpirationTime() {
    const formatTime = { days: expirationValues[0], hours: expirationValues[1], minutes: expirationValues[2] };
    const timeInSeconds = getOfferExpirationTimeInSeconds(formatTime);
    onSubmit(timeInSeconds);
  }

  function viewSection() {
    const countdownDisplay =
      !isGetHeightInfoLoading && !isGetTimestampForHeightLoading && isWalletSynced && currentTime !== -20
        ? OfferBuilderExpirationCountdown(currentTime, expirationTime, false)
        : t`Loading expiration time...`;
    return (
      <Grid xs={12} item>
        {isExpired ? (
          <Alert severity="error">{t`Offer has expired.`}</Alert>
        ) : (
          <Alert severity="warning">{countdownDisplay}</Alert>
        )}
      </Grid>
    );
  }

  function editSection() {
    return (
      <Form methods={methods} key={0} onSubmit={onSubmit}>
        <Grid
          xs={12}
          item
          border={1}
          borderColor={theme.palette.mode === 'light' ? Color.Neutral[300] : Color.Neutral[600]}
          borderRadius={2}
          overflow="hidden"
        >
          <Accordion
            expanded={isExpirationExpanded}
            onChange={(_event, isExpanded: boolean) => {
              if (!wasOfferExpirationVisited) {
                setWasOfferExpirationVisited(true);
              }
              setIsExpirationExpanded(isExpanded);
            }}
            sx={{ boxShadow: 'none', bgcolor: 'transparent' }}
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
                <Flex flexDirection="row" alignItems="center" gap="0.5rem" paddingTop="0px" bgcolor="none">
                  <Flex
                    height="32px"
                    width="32px"
                    bgcolor={theme.palette.mode === 'light' ? Color.Neutral[200] : Color.Neutral[700]}
                    borderRadius="10px"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Flex marginTop="12px">
                      <HourglassIcon color="info" sx={{ fontSize: '32px' }} />
                    </Flex>
                  </Flex>
                  <ViewTitle expirationValues={expirationValues} willExpirationBeEnabled={willExpirationBeEnabled} />
                </Flex>
              </Badge>
            </AccordionSummary>
            <AccordionDetails>
              <Flex
                flexDirection="row"
                justifyContent="space-between"
                width="100%"
                bgcolor={theme.palette.mode === 'light' ? Color.Neutral[200] : Color.Neutral[700]}
                borderRadius="10px"
                padding="1rem"
              >
                <Flex flexDirection="column" gap={1}>
                  <Typography variant="h6" fontWeight="500">
                    <Trans>Offer Expiration</Trans>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <Trans>Set a time after which this offer expires.</Trans>
                    <br />
                    <Link onClick={handleNavToSettings}>
                      <Trans>Change default timing.</Trans>
                    </Link>
                  </Typography>
                </Flex>
                <Flex alignSelf="center" gap={2}>
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
                  <Button
                    variant="outlined"
                    type="submit"
                    disabled={!willExpirationBeEnabled}
                    color="primary"
                    onClick={() => {
                      methods.setValue('days', 0);
                      methods.setValue('hours', 0);
                      methods.setValue('minutes', 0);
                    }}
                  >
                    <Trans>Disable</Trans>
                  </Button>
                </Flex>
              </Flex>
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
