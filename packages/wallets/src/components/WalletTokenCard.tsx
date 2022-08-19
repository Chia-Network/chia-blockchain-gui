import React, { useEffect, useMemo, useState } from 'react';
import { WalletType } from '@chia/api';
import { useSetCATNameMutation } from '@chia/api-react';
import { Trans } from '@lingui/macro';
import { Box, Typography, Switch, CircularProgress } from '@mui/material';
import {
  Tooltip,
  CardListItem,
  Flex,
  Link,
  useShowError,
  Form,
  TextField,
} from '@chia/core';
import { type ListItem } from '../hooks/useWalletsList';
import { useForm } from 'react-hook-form';

export type WalletTokenCardProps = {
  item: ListItem;
  onHide: (id: number) => void;
  onShow: (id: number | string) => Promise<void>;
};

type FormData = {
  name: string;
};

export default function WalletTokenCard(props: WalletTokenCardProps) {
  const {
    item: { type, walletType, walletId, assetId, hidden, name = '' },
    onHide,
    onShow,
  } = props;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [setCATName] = useSetCATNameMutation();
  const showError = useShowError();
  const form = useForm<FormData>({
    defaultValues: {
      name,
    },
  });

  useEffect(() => {
    form.setValue('name', name);
  }, [form, name]);

  async function handleSubmit(values: FormData) {
    return handleRename(values.name);
  }

  async function handleRename(newName: string) {
    try {
      if (!newName || newName === name) {
        return;
      }

      setIsLoading(true);

      let currentWalletId = walletId;

      if (!currentWalletId) {
        if (!assetId) {
          return;
        }

        currentWalletId = await onShow(assetId);

        // hide wallet
        if (hidden) {
          await onHide(currentWalletId);
        }
      }

      if (currentWalletId) {
        await setCATName({
          walletId: currentWalletId,
          name: newName,
        }).unwrap();
      }
    } catch (error) {
      showError(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVisibleChange(event) {
    try {
      const { checked } = event.target;
      const id = walletId ?? assetId;
      if (checked) {
        setIsLoading(true);
        await onShow(id);
      } else {
        onHide(id);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const subTitle = useMemo(() => {
    if (type === 'WALLET') {
      if (walletType === WalletType.CAT) {
        return assetId;
      }

      return '';
    }

    return assetId;
  }, [assetId, type, walletType]);

  return (
    <CardListItem>
      <Flex gap={1} alignItems="center" width="100%">
        <Flex
          flexDirection="column"
          gap={0.5}
          flexGrow={1}
          flexBasis={0}
          minWidth={0}
        >
          {walletType === WalletType.STANDARD_WALLET ? (
            <Typography noWrap>{name}</Typography>
          ) : (
            <Form methods={form} onSubmit={handleSubmit}>
              <TextField
                name="name"
                label="Name"
                onBlur={(event) => handleRename(event.target.value)}
                size="small"
                fullWidth
                hiddenLabel
              />
            </Form>
          )}
          {(!!subTitle || assetId) && (
            <Flex
              flexDirection="column"
              flexGrow={1}
              flexBasis={0}
              minWidth={0}
            >
              {!!subTitle && (
                <Tooltip
                  title={subTitle}
                  PopperProps={{
                    popperOptions: {
                      modifiers: [
                        {
                          name: 'offset',
                          options: { offset: [0, -12] },
                        },
                      ],
                    },
                  }}
                  copyToClipboard
                >
                  <Typography color="textSecondary" variant="caption" noWrap>
                    {subTitle}
                  </Typography>
                </Tooltip>
              )}
              {assetId && (
                <Link
                  href={`https://www.taildatabase.com/tail/${assetId}`}
                  target="_blank"
                  variant="caption"
                >
                  <Trans>Search on Tail Database</Trans>
                </Link>
              )}
            </Flex>
          )}
        </Flex>
        {walletType !== WalletType.STANDARD_WALLET && (
          <Box width="60px" textAlign="center">
            {isLoading ? (
              <CircularProgress size={32} />
            ) : (
              <Switch checked={!hidden} onChange={handleVisibleChange} />
            )}
          </Box>
        )}
      </Flex>
    </CardListItem>
  );
}
