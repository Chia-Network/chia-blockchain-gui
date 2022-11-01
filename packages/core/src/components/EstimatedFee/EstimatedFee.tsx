import React, { useState, useEffect } from 'react';
import { get } from 'lodash';
import { Controller, useFormContext } from 'react-hook-form';
import { Trans } from '@lingui/macro';
import { useGetFeeEstimateQuery } from '@chia/api-react';
import {
  Fee,
  Flex,
  mojoToChiaLocaleString,
  useCurrencyCode,
  useLocale,
} from '@chia/core';
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select as MaterialSelect,
  SelectProps,
  Typography,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import useMode from '../../hooks/useMode';
import Mode from '../../constants/Mode';

type Props = SelectProps & {
  hideError?: boolean;
  name: string;
};

function Select(props: Props) {
  const {
    name: controllerName,
    value: controllerValue,
    estList,
    selectedValue,
    selectedTime,
    onTypeChange,
    onTimeChange,
    onValueChange,
    children,
    ...rest
  } = props;
  const { control, errors, setValue } = useFormContext();
  const errorMessage = get(errors, controllerName);

  function getTimeByValue(object, value) {
    const estIndex = Object.keys(object).find(
      (index) => object[index].estimate === value
    );
    const estTime = object[estIndex].time;
    return estTime;
  }

  return (
    <Controller
      name={controllerName}
      control={control}
      render={({ field: { onChange, onBlur, value, name, ref } }) => (
        <MaterialSelect
          onChange={(event, ...args) => {
            onChange(event, ...args);
            if (props.onChange) {
              props.onChange(event, ...args);
            }
            if (event.target.value == 'custom') {
              onTypeChange('custom');
              setValue(controllerName, '');
            } else {
              onTypeChange('dropdown');
              onTimeChange(getTimeByValue(estList, event.target.value));
              onValueChange(event.target.value);
            }
          }}
          onBlur={onBlur}
          value={selectedValue}
          name={name}
          ref={ref}
          error={!!errorMessage}
          renderValue={(value) => {
            return (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {selectedValue} (~{selectedTime} min)
              </Box>
            );
          }}
          {...rest}
        >
          {children}
        </MaterialSelect>
      )}
    />
  );
}

function CountdownBar(props: Props) {
  const { start, refreshTime, ...rest } = props;
  var [seconds, setSeconds] = useState(new Date().getSeconds());
  const refreshSec = refreshTime * 10e-4;

  useEffect(() => {
    var timer = setInterval(() => setSeconds(new Date().getSeconds()), 500);
    return function cleanup() {
      clearInterval(timer);
    };
  });

  var modSec = (((seconds - start) % refreshSec) + refreshSec) % refreshSec;
  var currentProgress = Math.floor(modSec * (100 / refreshSec));

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
    textAlign: 'right',
  };

  const labelStyle = {
    padding: 0,
    color: 'white',
    fontWeight: 'bold',
  };

  return (
    <div style={containerStyle}>
      <div style={fillerStyle}>
        <span style={labelStyle}></span>
      </div>
    </div>
  );
}

export default function EstimatedFee(props: FeeProps) {
  const { name, txType, required, ...rest } = props;
  const { setValue } = useFormContext();
  const [startTime, setStartTime] = useState(new Date().getSeconds());
  const refreshTime = 60000; // in milliseconds
  const {
    data: ests,
    isLoading: isFeeLoading,
    error,
  } = useGetFeeEstimateQuery(
    { targetTimes: [60, 120, 300], cost: 1 },
    {
      pollingInterval: refreshTime,
    }
  );
  const [estList, setEstList] = React.useState([]);
  const [inputType, setInputType] = React.useState('dropdown');
  const [selectedValue, setSelectedValue] = React.useState('');
  const [selectedTime, setSelectedTime] = React.useState('');
  const mode = useMode();
  const [selectOpen, setSelectOpen] = React.useState(false);
  const [locale] = useLocale();
  const currencyCode = useCurrencyCode();

  const maxBlockCostCLVM = 11000000000;
  const offersAcceptsPerBlock = 500;

  const txCostEstimates = {
    walletSendXCH: Math.floor(maxBlockCostCLVM / 1170),
    createOffer: Math.floor(maxBlockCostCLVM / offersAcceptsPerBlock),
    spendCATtx: 29303497,
    sellNFT: Math.floor(maxBlockCostCLVM / 92),
    createPoolingWallet: Math.floor(maxBlockCostCLVM / 462), // JOIN_POOL in GUI = create pooling wallet
  };

  const multiplier = txCostEstimates[txType];

  function formatEst(number, multiplier, locale) {
    let num = Math.round(number * multiplier * 10 ** -4) * 10 ** 4;
    let formatNum = mojoToChiaLocaleString(num, locale);
    return formatNum;
  }

  function getValueByTime(object, time) {
    const estIndex = Object.keys(object).find(
      (index) => object[index].time === time
    );
    const estValue = object[estIndex].estimate;
    return estValue;
  }

  useEffect(() => {
    if (ests) {
      const estimateList = ests.estimates;
      const targetTimes = ests.targetTimes;
      // if (
      //   estimateList[0] == 0 &&
      //   estimateList[1] == 0 &&
      //   estimateList[2] == 0
      // ) {
      //   //setInputType('classic');
      // }
      const est0 =
        estimateList[0] === 0
          ? formatEst(6_000_000, 1, locale)
          : formatEst(estimateList[0], multiplier, locale);
      const est1 =
        estimateList[1] === 0
          ? formatEst(5_000_000, 1, locale)
          : formatEst(estimateList[1], multiplier, locale);
      const est2 =
        estimateList[2] === 0
          ? formatEst(0, 1, locale)
          : formatEst(estimateList[2], multiplier, locale);
      setEstList((current) => []);
      setEstList((current) => [
        ...current,
        {
          time: targetTimes[0] / 60,
          timeText: 'Likely in ' + targetTimes[0] + ' seconds',
          estimate: est0,
        },
      ]);
      setEstList((current) => [
        ...current,
        {
          time: targetTimes[1] / 60,
          timeText: 'Likely in ' + targetTimes[1] / 60 + ' minutes',
          estimate: est1,
        },
      ]);
      setEstList((current) => [
        ...current,
        {
          time: targetTimes[2] / 60,
          timeText: 'Likely over ' + targetTimes[2] / 60 + ' minutes',
          estimate: est2,
        },
      ]);
    }
  }, [ests]);

  useEffect(() => {
    if (estList) {
      if (selectedTime) {
        setSelectedValue(getValueByTime(estList, selectedTime));
        setValue(name, getValueByTime(estList, selectedTime));
      }
    }
  }, [estList]);

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
            estList={estList}
            selectedValue={selectedValue}
            selectedTime={selectedTime}
            {...rest}
          >
            {estList.map((option) => (
              <MenuItem value={String(option.estimate)} key={option.time}>
                <Flex
                  flexDirection="row"
                  flexGrow={1}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Flex>
                    <Trans>
                      {option.estimate} {currencyCode}
                    </Trans>
                  </Flex>
                  <Flex alignSelf="center">
                    <Trans>
                      <Typography color="textSecondary" fontSize="small">
                        {option.timeText}
                      </Typography>
                    </Trans>
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
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={showDropdown}>
                      <ArrowDropDownIcon />
                    </IconButton>
                  ),
                  style: {
                    paddingRight: '0',
                  },
                }}
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

  if (!error && mode[0] === Mode.FARMING && inputType !== 'classic') {
    return (
      <Flex>
        <FormControl variant="filled" fullWidth>
          {inputType === 'dropdown' ? showSelect() : showInput()}
        </FormControl>
      </Flex>
    );
  } else {
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
}
