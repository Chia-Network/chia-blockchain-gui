import { useGetFeeEstimateQuery } from '@chia-network/api-react';
import { Trans, t } from '@lingui/macro';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select as MaterialSelect,
  SelectProps as MaterialSelectProps,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type BigNumber from 'bignumber.js';
import React, { useState, useEffect, useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import Color from '../../constants/Color';
import Mode from '../../constants/Mode';
import useCurrencyCode from '../../hooks/useCurrencyCode';
import useLocale from '../../hooks/useLocale';
import useMode from '../../hooks/useMode';
import mojoToChiaLocaleString from '../../utils/mojoToChiaLocaleString';
import Fee from '../Fee';
import Flex from '../Flex';

import FeeTxType from './FeeTxType';
import { NO_TARGET_TIME, findFeeOption, getFeeOptions, getMinimumFee } from './minimumFee';

const REFRESH_SECONDS = 30;
const TARGET_TIMES = [60, 120, 300];

type FormattedEstimate = {
  minutes: number;
  timeDescription: string;
  estimate: BigNumber;
  formattedEstimate: string;
};

type SelectProps = MaterialSelectProps & {
  name: string;
  formattedEstimates: FormattedEstimate[];
  selectedValue: string;
  selectedTime: number;
  hasEstimates: boolean;
  onTypeChange: (type: 'dropdown' | 'custom') => void;
  onTimeChange: (time: number) => void;
  onValueChange: (value: string) => void;
};

function Select(props: SelectProps) {
  const {
    name: controllerName,
    value: controllerValue,
    formattedEstimates,
    selectedValue,
    selectedTime,
    hasEstimates,
    onTypeChange,
    onTimeChange,
    onValueChange,
    currencyCode,
    children,
    ...rest
  } = props;
  const {
    control,
    formState: { errors },
    setValue,
  } = useFormContext();
  const haveError = Object.keys(errors).length > 0;
  const displayedTime =
    selectedTime !== NO_TARGET_TIME ? t`(~${selectedTime} min)` : hasEstimates ? t`(>5 min)` : t`(minimum)`;

  return (
    <Controller
      name={controllerName}
      control={control}
      render={({ field: { onChange, onBlur, name, ref } }) => (
        <MaterialSelect
          onChange={(event, ...args) => {
            onChange(event, ...args);
            if (props.onChange) {
              props.onChange(event, ...args);
            }
            if (event.target.value === 'custom') {
              onTypeChange('custom');
              setValue(controllerName, '');
            } else {
              onTypeChange('dropdown');
              onTimeChange(
                formattedEstimates.find((estimate) => estimate.formattedEstimate === (event.target.value as string))
                  ?.minutes ?? 0,
              );
              onValueChange(event.target.value as string);
            }
          }}
          onBlur={onBlur}
          value={selectedValue}
          name={name}
          ref={ref}
          error={haveError}
          renderValue={() => (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box sx={{ flexGrow: 1 }}>
                {selectedValue} {displayedTime}
              </Box>
              <Box sx={{ position: 'relative', top: '-8px' }}>
                <Typography color="textSecondary">{currencyCode}</Typography>
              </Box>
            </Box>
          )}
          {...rest}
        >
          {children}
        </MaterialSelect>
      )}
    />
  );
}

function CountdownBar({ startTime, refreshSeconds }: { startTime: number; refreshSeconds: number }) {
  const theme = useTheme();
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    let animationId: number | null = null;
    const updateProgress = () => {
      const elapsedTime = Date.now() - startTime;
      setCurrentProgress(Math.min(100, (elapsedTime / (refreshSeconds * 1000)) * 100));
      animationId = requestAnimationFrame(updateProgress);
    };
    updateProgress();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [startTime, refreshSeconds]);

  const containerStyle = {
    height: 2,
    width: '100%',
    backgroundColor: theme.palette.divider,
    borderRadius: 0,
    margin: 0,
  };

  const fillerStyle = {
    height: '100%',
    width: `${currentProgress}%`,
    backgroundColor: theme.palette.primary.main,
    borderRadius: 'inherit',
    // textAlign: 'right',
  };

  const labelStyle = {
    padding: 0,
    color: Color.Neutral[50],
    fontWeight: 'bold',
  };

  return (
    <div style={containerStyle}>
      <div style={fillerStyle}>
        <span style={labelStyle} />
      </div>
    </div>
  );
}

type FeeProps = {
  name: string;
  txType: FeeTxType;
  count?: number; // number of spends of txType in the transaction, for bulk actions
  required?: boolean;
};

export default function EstimatedFee(props: FeeProps) {
  const { name, txType, count = 1, required, ...rest } = props;
  const [mode] = useMode();
  const { setValue } = useFormContext();
  const [requestId, setRequestId] = useState<string | undefined>(undefined);
  const [startTime, setStartTime] = useState<number | undefined>(undefined);
  const result = useGetFeeEstimateQuery(
    { targetTimes: TARGET_TIMES, spendType: txType },
    {
      pollingInterval: REFRESH_SECONDS * 1000, // in milliseconds
      skip: mode === Mode.WALLET,
    },
  );
  const { data: ests, isLoading, isSuccess, requestId: feeEstimateRequestId, startedTimeStamp } = result;

  const currentValue = useWatch({ name, defaultValue: '' });
  const isCustom = currentValue !== '';

  const [inputType, setInputType] = React.useState(isCustom ? 'custom' : 'dropdown');
  const [defaultFee, setDefaultFee] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState('');
  const [selectedTime, setSelectedTime] = React.useState(0);
  const [selectOpen, setSelectOpen] = React.useState(false);
  const [locale] = useLocale();
  const currencyCode = useCurrencyCode();

  const minimumFee = useMemo(() => getMinimumFee(txType, count), [txType, count]);
  const hasEstimates = !!ests?.estimates;

  const formattedEstimates: FormattedEstimate[] = useMemo(
    () =>
      getFeeOptions(ests?.estimates, TARGET_TIMES, minimumFee, count).map(({ minutes, estimate }) => ({
        minutes,
        timeDescription:
          minutes > 1
            ? t`Likely in ${minutes} minutes`
            : minutes !== NO_TARGET_TIME
              ? t`Likely in ${minutes * 60} seconds`
              : hasEstimates
                ? t`Likely in >5 minutes`
                : t`Minimum fee`,
        estimate,
        formattedEstimate: mojoToChiaLocaleString(estimate, locale),
      })),
    [ests, hasEstimates, minimumFee, count, locale],
  );

  useEffect(() => {
    if (!isLoading) {
      if (!isSuccess) {
        setStartTime(undefined);
      } else if (feeEstimateRequestId !== requestId) {
        setRequestId(feeEstimateRequestId);
        setStartTime(startedTimeStamp);
      }
    }
  }, [requestId, setRequestId, feeEstimateRequestId, startedTimeStamp, isLoading, isSuccess]);

  useEffect(() => {
    if (formattedEstimates && inputType === 'dropdown') {
      // The minimum fee does not depend on the estimates, so it is applied before they load.
      // Otherwise a submit during the request would send an empty fee.
      // Without a minimum fee the default is zero, the same as an empty fee, so it waits for the
      // estimates. The zero fee option is tied to a target time only after they loaded.
      if (!defaultFee && (!isLoading || !minimumFee.isZero())) {
        const defaultVal = formattedEstimates.find((formattedEstimate) => formattedEstimate.estimate.eq(minimumFee));
        if (defaultVal) {
          setSelectedValue(defaultVal.formattedEstimate);
          setSelectedTime(defaultVal.minutes);
          setValue(name, mojoToChiaLocaleString(defaultVal.estimate, 'en-US'));
        }
        setDefaultFee(true);
      }
      if (selectedTime) {
        const estimate = findFeeOption(formattedEstimates, selectedTime);
        if (estimate) {
          const xchFee = mojoToChiaLocaleString(estimate.estimate, 'en-US');
          setSelectedValue(estimate.formattedEstimate);
          setValue(name, xchFee);
          if (estimate.minutes !== selectedTime) {
            setSelectedTime(estimate.minutes);
          }
        }
      }
    }
  }, [formattedEstimates, minimumFee, name, selectedTime, setValue, defaultFee, isLoading, inputType]);

  const handleSelectOpen = () => {
    setSelectOpen(true);
  };

  const handleSelectClose = () => {
    setSelectOpen(false);
  };

  function showSelect() {
    return (
      <Box position="relative">
        <Box position="relative">
          <InputLabel required={required} color="secondary">
            Fee
          </InputLabel>
          <Select
            name={name}
            onTypeChange={setInputType}
            onTimeChange={setSelectedTime}
            onValueChange={setSelectedValue}
            open={selectOpen}
            onOpen={handleSelectOpen}
            onClose={handleSelectClose}
            formattedEstimates={formattedEstimates}
            selectedValue={selectedValue}
            selectedTime={selectedTime}
            hasEstimates={hasEstimates}
            currencyCode={currencyCode}
            {...rest}
          >
            {formattedEstimates.map((formattedEstimate) => (
              <MenuItem value={formattedEstimate.formattedEstimate} key={formattedEstimate.minutes}>
                <Flex flexDirection="row" flexGrow={1} justifyContent="space-between" alignItems="center">
                  <Flex>
                    {formattedEstimate.formattedEstimate} {currencyCode}
                  </Flex>
                  <Flex alignSelf="center">
                    <Typography color="textSecondary" fontSize="small">
                      {formattedEstimate.timeDescription}
                    </Typography>
                  </Flex>
                </Flex>
              </MenuItem>
            ))}
            <MenuItem value="custom" key="custom">
              Enter a custom fee...
            </MenuItem>
          </Select>
        </Box>
        {startTime && (
          <Box position="absolute" bottom={0} left={0} right={0}>
            <CountdownBar startTime={startTime} refreshSeconds={REFRESH_SECONDS} />
          </Box>
        )}
      </Box>
    );
  }

  function showInput() {
    function showDropdown() {
      setSelectOpen(true);
      setInputType('dropdown');
    }

    return (
      <Box position="relative">
        <Box position="relative">
          <Flex flexDirection="row">
            <Flex flexGrow={1}>
              <Fee
                name={name}
                type="text"
                variant="filled"
                label={<Trans>Fee</Trans>}
                fullWidth
                required={required}
                autoFocus
                color="secondary"
                minimumFee={minimumFee}
                dropdownAdornment={showDropdown}
              />
            </Flex>
          </Flex>
        </Box>
        {/* <Box position="absolute" bottom={3} left={0} right={0}>
          <CountdownBar start={startTime} refreshTime={refreshTime} />
        </Box> */}
      </Box>
    );
  }

  // if (!error && mode[0] === Mode.FARMING && inputType !== 'classic') {
  if (inputType !== 'classic' && formattedEstimates) {
    return (
      <Flex>
        <FormControl variant="filled" fullWidth>
          {inputType === 'dropdown' ? showSelect() : showInput()}
        </FormControl>
      </Flex>
    );
  }
  return (
    <Flex>
      <FormControl variant="filled" fullWidth>
        <Fee
          name={name}
          type="text"
          variant="filled"
          label={<Trans>Fee</Trans>}
          fullWidth
          required={required}
          color="secondary"
          minimumFee={minimumFee}
        />
      </FormControl>
    </Flex>
  );
}
