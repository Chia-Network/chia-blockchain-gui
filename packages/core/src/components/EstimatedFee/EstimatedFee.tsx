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
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import useCurrencyCode from '../../hooks/useCurrencyCode';
import useLocale from '../../hooks/useLocale';
import mojoToChiaLocaleString from '../../utils/mojoToChiaLocaleString';
import Fee from '../Fee';
import Flex from '../Flex';

const REFRESH_SECONDS = 30;
const TARGET_TIMES = [60, 120, 300];

type FormattedEstimate = {
  minutes: number;
  timeDescription: string;
  estimate: number;
  formattedEstimate: string;
};

type SelectProps = MaterialSelectProps & {
  name: string;
  formattedEstimates: FormattedEstimate[];
  selectedValue: string;
  selectedTime: number;
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
  const displayedTime = selectedTime === -1 ? t`(>5 min)` : t`(~${selectedTime} min)`;

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
                  ?.minutes ?? 0
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
    backgroundColor: '#e0e0de',
    borderRadius: 0,
    margin: 0,
  };

  const fillerStyle = {
    height: '100%',
    width: `${currentProgress}%`,
    backgroundColor: 'green',
    borderRadius: 'inherit',
    // textAlign: 'right',
  };

  const labelStyle = {
    padding: 0,
    color: 'white',
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

enum FeeTxType {
  walletSendXCH = 'walletSendXCH',
  spendCATtx = 'spendCATtx',
  acceptOffer = 'acceptOffer',
  cancelOffer = 'cancelOffer',
  burnNFT = 'burnNFT',
  assignDIDToNFT = 'assignDIDToNFT',
  transferNFT = 'transferNFT',
  createPlotNFT = 'createPlotNFT',
  claimPoolingReward = 'claimPoolingReward',
  createDID = 'createDID',
}

type FeeProps = {
  name: string;
  txType: FeeTxType;
  required?: boolean;
};

export default function EstimatedFee(props: FeeProps) {
  const { name, txType, required, ...rest } = props;
  const { setValue } = useFormContext();
  const [requestId, setRequestId] = useState<string | undefined>(undefined);
  const [startTime, setStartTime] = useState<number | undefined>(undefined);
  const result = useGetFeeEstimateQuery(
    { targetTimes: TARGET_TIMES, cost: 1 },
    {
      pollingInterval: REFRESH_SECONDS * 1000, // in milliseconds
    }
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

  const maxBlockCostCLVM = 11_000_000_000;

  const txCostEstimates = {
    walletSendXCH: Math.floor(maxBlockCostCLVM / 1170),
    spendCATtx: 36_382_111,
    acceptOffer: 721_393_265,
    cancelOffer: 212_443_993,
    burnNFT: 74_385_541,
    assignDIDToNFT: 115_540_006,
    transferNFT: 74_385_541,
    createPlotNFT: 18_055_407,
    claimPoolingReward: 82_668_466,
    createDID: 57_360_396,
  };

  const multiplier = txCostEstimates[txType];

  const multiplyEstimate = useCallback((estimate: number, multiplierLocal: number) => {
    const num = Math.round(estimate * multiplierLocal * 10 ** -4) * 10 ** 4;
    return num;
  }, []);

  const formatEst = useCallback(
    (number: number, multiplierLocal: number, localeLocal: string) => {
      const num = multiplyEstimate(number, multiplierLocal);
      return mojoToChiaLocaleString(num, localeLocal);
    },
    [multiplyEstimate]
  );

  const formattedEstimates: FormattedEstimate[] = useMemo(() => {
    const estimateList = ests?.estimates ?? [0, 0, 0];
    const defaultValues = [6_000_000, 5_000_000, 0];
    const allZeroes = estimateList.filter((value: number) => value !== 0).length === 0;
    const estList = allZeroes // update estimate list to include a 0 fee entry if not already present
      ? defaultValues.some((val) => val === 0)
        ? defaultValues
        : defaultValues.concat([0])
      : estimateList.some((val) => val === 0)
      ? estimateList
      : estimateList.concat([0]);

    return estList.map((estimate: number, i: number) => {
      const multiplierLocal = allZeroes ? 1 : multiplier;
      const multipliedEstimate = multiplyEstimate(estimate, multiplierLocal);
      const formattedEstimate = formatEst(estimate, multiplierLocal, locale);
      const minutes = i === 3 ? -1 : TARGET_TIMES[i] / 60; // -1 designates a conditionally-added fourth dropdown selection with 0 fee and >5 minutes

      return {
        minutes,
        timeDescription:
          minutes > 1
            ? t`Likely in ${minutes} minutes`
            : minutes === -1
            ? t`Likely in >5 minutes`
            : t`Likely in ${TARGET_TIMES[i]} seconds`,
        estimate: multipliedEstimate,
        formattedEstimate,
      };
    });
  }, [ests, locale, multiplier, formatEst, multiplyEstimate]);

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
    if (formattedEstimates) {
      if (!defaultFee) {
        const defaultVal = formattedEstimates.find((formattedEstimate) => formattedEstimate.estimate === 0);
        if (defaultVal) {
          setSelectedValue(defaultVal.estimate);
          setSelectedTime(defaultVal.minutes);
        }
        setDefaultFee(true);
      }
      if (selectedTime) {
        const estimate = formattedEstimates.find((formattedEstimate) => formattedEstimate.minutes === selectedTime);
        if (estimate) {
          const xchFee = mojoToChiaLocaleString(estimate.estimate, 'en-US');
          setSelectedValue(estimate.formattedEstimate);
          setValue(name, xchFee);
        }
      }
    }
  }, [formattedEstimates, name, selectedTime, setValue, defaultFee]);

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
        />
      </FormControl>
    </Flex>
  );
}
