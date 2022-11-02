import React from 'react';
import { useWatch } from 'react-hook-form';
import { Trans } from '@lingui/macro';
import {
  Amount,
  CopyToClipboard,
  Fee,
  Flex,
  FormatLargeNumber,
  Link,
  Loading,
  StateColor,
  TextField,
  Tooltip,
  TooltipIcon,
} from '@chia/core';
import { Box, Typography, IconButton } from '@mui/material';
import { Remove } from '@mui/icons-material';
import useOfferBuilderContext from '../../hooks/useOfferBuilderContext';
import OfferBuilderTokenSelector from './OfferBuilderTokenSelector';
import OfferBuilderRoyaltyPayouts from './OfferBuilderRoyaltyPayouts';

export type OfferBuilderValueProps = {
  name: string;
  label: ReactNode;
  caption?: ReactNode;
  type?: 'text' | 'amount' | 'fee' | 'token';
  isLoading?: boolean;
  onRemove?: () => void;
  symbol?: string;
  showAmountInMojos?: boolean;
  usedAssets?: string[];
  disableReadOnly?: boolean;
  warnUnknownCAT?: boolean;
  amountWithRoyalties?: string;
  royaltyPayments?: Record<string, any>[];
};

export default function OfferBuilderValue(props: OfferBuilderValueProps) {
  const {
    name,
    caption,
    label,
    onRemove,
    isLoading = false,
    type = 'text',
    symbol,
    showAmountInMojos,
    usedAssets,
    disableReadOnly = false,
    warnUnknownCAT = false,
    amountWithRoyalties,
    royaltyPayments,
  } = props;
  const {
    readOnly: builderReadOnly,
    offeredUnknownCATs,
    requestedUnknownCATs,
  } = useOfferBuilderContext();
  const value = useWatch({
    name,
  });
  const readOnly = disableReadOnly ? false : builderReadOnly;
  const displayValue = amountWithRoyalties ? (
    amountWithRoyalties
  ) : !value ? (
    <Trans>Not Available</Trans>
  ) : ['amount', 'fee', 'token'].includes(type) && Number.isFinite(value) ? (
    <FormatLargeNumber value={value} />
  ) : (
    value
  );

  return (
    <Flex flexDirection="column" minWidth={0} gap={1}>
      {isLoading ? (
        <Loading />
      ) : readOnly ? (
        <>
          <Typography variant="body2" color="textSecondary">
            {label}
          </Typography>
          <Tooltip
            title={
              royaltyPayments && amountWithRoyalties ? (
                <OfferBuilderRoyaltyPayouts
                  totalAmount={amountWithRoyalties}
                  originalAmount={value}
                  royaltyPayments={royaltyPayments}
                />
              ) : (
                <Flex flexDirection="column" gap={1}>
                  <Flex flexDirection="row" alignItems="center" gap={1}>
                    <Flex flexDirection="column" gap={1} maxWidth={200}>
                      {displayValue}
                      {type === 'token' ? (
                        <Link
                          href={`https://www.taildatabase.com/tail/${value.toLowerCase()}`}
                          target="_blank"
                        >
                          <Trans>Search on Tail Database</Trans>
                        </Link>
                      ) : null}
                    </Flex>
                    <CopyToClipboard
                      value={displayValue}
                      fontSize="small"
                      invertColor
                    />
                  </Flex>
                </Flex>
              )
            }
          >
            <Typography variant="h6" noWrap>
              {type === 'token' ? (
                <OfferBuilderTokenSelector
                  variant="filled"
                  color="secondary"
                  label={label}
                  name={name}
                  warnUnknownCAT={warnUnknownCAT}
                  required
                  fullWidth
                  readOnly
                />
              ) : (
                <>
                  {displayValue}
                  &nbsp;
                  {symbol}
                </>
              )}
            </Typography>
          </Tooltip>
        </>
      ) : (
        <Flex gap={2} alignItems="center">
          <Box flexGrow={1} minWidth={0}>
            {type === 'amount' ? (
              <Amount
                variant="filled"
                color="secondary"
                label={label}
                name={name}
                symbol={symbol}
                showAmountInMojos={showAmountInMojos}
                required
                fullWidth
              />
            ) : type === 'fee' ? (
              <Fee
                variant="filled"
                color="secondary"
                label={label}
                name={name}
                required
                fullWidth
              />
            ) : type === 'text' ? (
              <TextField
                variant="filled"
                color="secondary"
                label={label}
                name={name}
                required
                fullWidth
              />
            ) : type === 'token' ? (
              <OfferBuilderTokenSelector
                variant="filled"
                color="secondary"
                label={label}
                name={name}
                usedAssets={usedAssets}
                required
                fullWidth
              />
            ) : (
              <Typography variant="body2">
                <Trans>{type} is not supported</Trans>
              </Typography>
            )}
          </Box>
          {onRemove && (
            <Box>
              <IconButton onClick={onRemove}>
                <Remove />
              </IconButton>
            </Box>
          )}
        </Flex>
      )}
      {warnUnknownCAT && (
        <Flex gap={0.5} alignItems="center">
          <Typography variant="body2" color={StateColor.WARNING}>
            Unknown CAT
          </Typography>
          <TooltipIcon>
            {offeredUnknownCATs?.includes(value) ? (
              <Typography variant="caption" color="textSecondary">
                <Trans>
                  Offer cannot be accepted because you don&apos;t possess the
                  requested assets
                </Trans>
              </Typography>
            ) : requestedUnknownCATs?.includes(value) ? (
              <Typography variant="caption" color="textSecondary">
                <Trans>
                  Warning: Verify that the offered CAT asset IDs match the asset
                  IDs of the tokens you expect to receive.
                </Trans>
              </Typography>
            ) : null}
          </TooltipIcon>
        </Flex>
      )}
      {caption && (
        <Typography variant="caption" color="textSecondary">
          {caption}
        </Typography>
      )}
    </Flex>
  );
}
