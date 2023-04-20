import {
  Amount,
  CopyToClipboard,
  EstimatedFee,
  Fee,
  FeeTxType,
  Flex,
  FormatLargeNumber,
  Link,
  Loading,
  StateColor,
  TextField,
  Tooltip,
  TooltipIcon,
} from '@chia-network/core';
import { Trans } from '@lingui/macro';
import { Remove } from '@mui/icons-material';
import { Box, Typography, IconButton } from '@mui/material';
import React, { useCallback, type ReactNode } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import useOfferBuilderContext from '../../hooks/useOfferBuilderContext';
import NFTSearch from '../nfts/NFTSearch';
import OfferBuilderAmountWithRoyalties from './OfferBuilderAmountWithRoyalties';
import OfferBuilderRoyaltyPayouts from './OfferBuilderRoyaltyPayouts';
import OfferBuilderTokenSelector from './OfferBuilderTokenSelector';

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

  const { readOnly: builderReadOnly, offeredUnknownCATs, requestedUnknownCATs } = useOfferBuilderContext();

  const value = useWatch({
    name,
  });

  const formContext = useFormContext();

  const handleSelectNFT = useCallback(
    (nftId) => {
      formContext.setValue(name, nftId);
    },
    [name, formContext]
  );

  const readOnly = disableReadOnly ? false : builderReadOnly;
  const displayValue =
    amountWithRoyalties ||
    (!value ? (
      <Trans>Not Available</Trans>
    ) : ['amount', 'fee', 'token'].includes(type) && Number.isFinite(value) ? (
      <FormatLargeNumber value={value} />
    ) : (
      value
    ));

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
                        <Link href={`https://www.taildatabase.com/tail/${value.toLowerCase()}`} target="_blank">
                          <Trans>Search on Tail Database</Trans>
                        </Link>
                      ) : null}
                    </Flex>
                    <CopyToClipboard value={displayValue} fontSize="small" invertColor />
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
              builderReadOnly ? (
                <EstimatedFee
                  txType={FeeTxType.acceptOffer}
                  variant="filled"
                  color="secondary"
                  label={label}
                  name={name}
                  fullWidth
                />
              ) : (
                <Fee variant="filled" color="secondary" label={label} name={name} fullWidth />
              )
            ) : type === 'text' ? (
              <>
                <TextField variant="filled" color="secondary" label={label} name={name} required fullWidth />
                <NFTSearch value={value} onSelectNFT={handleSelectNFT} />
              </>
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
                <Trans>Offer cannot be accepted because you don&apos;t possess the requested assets</Trans>
              </Typography>
            ) : requestedUnknownCATs?.includes(value) ? (
              <Typography variant="caption" color="textSecondary">
                <Trans>
                  Warning: Verify that the offered CAT asset IDs match the asset IDs of the tokens you expect to
                  receive.
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
      {!builderReadOnly && royaltyPayments && amountWithRoyalties && (
        <OfferBuilderAmountWithRoyalties
          originalAmount={value}
          totalAmount={amountWithRoyalties}
          royaltyPayments={royaltyPayments}
        />
      )}
    </Flex>
  );
}
