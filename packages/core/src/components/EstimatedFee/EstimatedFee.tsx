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
import React, { useState, useEffect, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import useCurrencyCode from '../../hooks/useCurrencyCode';
import useLocale from '../../hooks/useLocale';
import mojoToChiaLocaleString from '../../utils/mojoToChiaLocaleString';
import Fee from '../Fee';
import Flex from '../Flex';

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
    children,
    ...rest
  } = props;
  const {
    control,
    formState: { errors },
    setValue,
  } = useFormContext();
  const haveError = Object.keys(errors).length > 0;

  function getTimeByValue(object: FormattedEstimate[], value: string) {
    const match = object.find((estimate) => estimate.formattedEstimate === value);
    return match?.minutes ?? 0;
  }

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
              onTimeChange(getTimeByValue(formattedEstimates, event.target.value as string));
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
              {selectedValue} (~{selectedTime} min)
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

function CountdownBar({ start, refreshTime }: { start: number; refreshTime: number }) {
  const [seconds, setSeconds] = useState(new Date().getSeconds());
  const refreshSec = refreshTime * 10e-4;

  useEffect(() => {
    const timer = setInterval(() => setSeconds(new Date().getSeconds()), 500);
    return function cleanup() {
      clearInterval(timer);
    };
  });

  const modSec = (((seconds - start) % refreshSec) + refreshSec) % refreshSec;
  const currentProgress = Math.floor(modSec * (100 / refreshSec));

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
  const [startTime] = useState(new Date().getSeconds());
  const refreshTime = 10_000; // in milliseconds
  const targetTimes = TARGET_TIMES;
  const { data: ests } = useGetFeeEstimateQuery(
    { targetTimes, cost: 1 },
    {
      pollingInterval: refreshTime,
    }
  );
  const [inputType, setInputType] = React.useState('dropdown');
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

  function formatEst(number: number, multiplierLocal: number, localeLocal: string) {
    const num = Math.round(number * multiplierLocal * 10 ** -4) * 10 ** 4;
    return mojoToChiaLocaleString(num, localeLocal);
  }

  const formattedEstimates: FormattedEstimate[] = useMemo(() => {
    const estimateList = ests?.estimates ?? [0, 0, 0];
    const defaultValues = [6_000_000, 5_000_000, 0];
    const allZeroes = estimateList.filter((value: number) => value !== 0).length === 0;

    return (allZeroes ? defaultValues : estimateList).map((estimate: number, i: number) => {
      const formattedEstimate = formatEst(estimate, allZeroes ? 1 : multiplier, locale);
      const minutes = targetTimes[i] / 60;

      return {
        minutes,
        timeDescription: minutes > 1 ? t`Likely in ${minutes} minutes` : t`Likely in ${targetTimes[i]} seconds`,
        estimate,
        formattedEstimate,
      };
    });
  }, [ests, targetTimes, locale, multiplier]);

  useEffect(() => {
    if (formattedEstimates) {
      if (selectedTime) {
        const estimate = formattedEstimates.find((formattedEstimate) => formattedEstimate.minutes === selectedTime);
        if (estimate) {
          const xchFee = mojoToChiaLocaleString(estimate.estimate, 'en-US');
          setSelectedValue(estimate.formattedEstimate);
          setValue(name, xchFee);
        }
      }
    }
  }, [formattedEstimates, name, selectedTime, setValue]);

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
        <Box position="absolute" bottom={0} left={0} right={0}>
          <CountdownBar start={startTime} refreshTime={refreshTime} />
        </Box>
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
