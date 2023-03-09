import type { KeyData } from '@chia-network/api';
import { useFingerprintSettings, useGetLoggedInFingerprintQuery } from '@chia-network/api-react';
import { Trans } from '@lingui/macro';
import { Delete as DeleteIcon, Visibility as VisibilityIcon, Edit as EditIcon } from '@mui/icons-material';
import { Box, Typography, ListItemIcon, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useCallback, useState } from 'react';

import CardListItem from '../../components/CardListItem';
import Flex from '../../components/Flex';
import { MenuItem } from '../../components/MenuItem';
import More from '../../components/More';
import useOpenDialog from '../../hooks/useOpenDialog';
import EmojiAndColorPicker from './EmojiAndColorPicker';
import SelectKeyDetailDialog from './SelectKeyDetailDialog';
import SelectKeyRenameForm from './SelectKeyRenameForm';
import WalletDeleteDialog from './WalletDeleteDialog';
import WalletStatus from './WalletStatus';

type SelectKeyItemProps = {
  keyData: KeyData;
  index: number;
  disabled?: boolean;
  loading?: boolean;
  onSelect: (fingerprint: number) => void;
};

type WalletKeyTheme = {
  emoji: string | null;
  color: string | null;
};

export default function SelectKeyItem(props: SelectKeyItemProps) {
  const { keyData, onSelect, disabled, loading, index } = props;
  const openDialog = useOpenDialog();
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  const { data: currentFingerprint } = useGetLoggedInFingerprintQuery();

  const { fingerprint, label } = keyData;

  const [walletKeyTheme, setWalletKeyTheme] = useFingerprintSettings<WalletKeyTheme>(fingerprint, 'walletKeyTheme', {
    emoji: `🌱`,
    color: 'green',
  });

  const [tempWalletKeyTheme, setTempWalletKeyTheme] = useState<WalletKeyTheme>({} as WalletKeyTheme);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);

  const theme: any = useTheme();

  const isColor = useCallback((color: string) => Object.keys(theme.palette.colors).includes(color), [theme]);
  const isDark = theme.palette.mode === 'dark';
  const color = isColor(tempWalletKeyTheme.color || walletKeyTheme.color)
    ? theme.palette.colors[tempWalletKeyTheme.color || walletKeyTheme.color]
    : theme.palette.colors.default;

  async function handleLogin() {
    onSelect(fingerprint);
  }

  function handleShowKey() {
    openDialog(<SelectKeyDetailDialog fingerprint={fingerprint} index={index} />);
  }

  function handleRename() {
    setIsRenaming(true);
  }

  function handleCloseRename() {
    setIsRenaming(false);
  }

  async function handleDeletePrivateKey() {
    await openDialog(<WalletDeleteDialog fingerprint={fingerprint} />);
  }

  function renderOptions() {
    return (
      <Flex
        flexDirection="column"
        alignItems="flex-end"
        gap={0.5}
        sx={{
          svg: {
            path: {
              color: color.accent,
            },
          },
        }}
      >
        <More>
          <MenuItem onClick={handleRename} close>
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
            <Typography variant="inherit" noWrap>
              <Trans>Rename</Trans>
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleShowKey} close>
            <ListItemIcon>
              <VisibilityIcon />
            </ListItemIcon>
            <Typography variant="inherit" noWrap>
              <Trans>Details</Trans>
            </Typography>
          </MenuItem>
          <MenuItem onClick={handleDeletePrivateKey} close>
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            <Typography variant="inherit" noWrap>
              <Trans>Delete</Trans>
            </Typography>
          </MenuItem>
        </More>
      </Flex>
    );
  }

  function toggleEmojiPicker(e) {
    e.preventDefault();
    e.stopPropagation();
    setShowEmojiPicker(true);
  }

  function preventBubble(e: any) {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <CardListItem
      onSelect={isRenaming ? undefined : handleLogin}
      data-testid={`SelectKeyItem-fingerprint-${fingerprint}`}
      key={fingerprint}
      disabled={disabled}
      loading={loading}
      noPadding
      sx={{
        border: `1px solid ${color.border}`,
        ':hover': {
          border: `1px solid ${color.border}`,
        },
        '.MuiCardActionArea-focusHighlight': {
          // background: 'transparent',
        },
      }}
    >
      <Flex position="relative" flexDirection="column">
        <Flex sx={{ padding: '7px 10px 5px 10px', minHeight: '55px' }} direction="row">
          <Flex sx={{ padding: '0 10px 0 0', fontSize: '24px', position: 'relative' }}>
            <span
              style={{ display: showEmojiPicker ? 'inline' : 'none', position: 'fixed', zIndex: 10 }}
              onClick={preventBubble}
            >
              {showEmojiPicker && (
                <EmojiAndColorPicker
                  onSelect={(result: any) => {
                    if (result === '') {
                      setTempWalletKeyTheme({} as WalletKeyTheme);
                    } else if (isColor(result)) {
                      setWalletKeyTheme({ ...walletKeyTheme, color: result });
                    } else if (result !== '') {
                      setWalletKeyTheme({ ...walletKeyTheme, emoji: result });
                    }
                    setShowEmojiPicker(false);
                  }}
                  onClickOutside={() => {
                    setShowEmojiPicker(false);
                  }}
                  currentColor={walletKeyTheme.color}
                  currentEmoji={walletKeyTheme.emoji}
                  themeColors={theme.palette.colors}
                  isDark={isDark}
                  onSelectTempEmoji={(tEmoji: string) => {
                    setTempWalletKeyTheme({ ...tempWalletKeyTheme, emoji: tEmoji });
                  }}
                  onSelectTempColor={(tColor: string) => {
                    setTempWalletKeyTheme({ ...tempWalletKeyTheme, color: tColor });
                  }}
                />
              )}
            </span>
            <Flex
              sx={{
                zIndex: 9,
                ':hover': {
                  backgroundColor: color.main,
                },
                width: '40px',
                height: '40px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                background: 'none',
                transition: 'all .3s linear',
                backgroundColor: 'transparent',
              }}
              onClick={toggleEmojiPicker}
            >
              {tempWalletKeyTheme.emoji || walletKeyTheme.emoji}
            </Flex>
          </Flex>
          <Flex
            direction="column"
            gap={isRenaming ? 1 : 0}
            minWidth={0}
            flexGrow={1}
            sx={{
              ' > h6': {
                lineHeight: 1.3,
                paddingTop: '2px',
              },
            }}
          >
            {isRenaming ? (
              <Flex
                sx={{
                  input: {
                    padding: '6px',
                  },
                  position: 'relative',
                  top: '2px',
                }}
              >
                <SelectKeyRenameForm keyData={keyData} onClose={handleCloseRename} />
              </Flex>
            ) : (
              <Typography variant="subtitle1" noWrap>
                {label || <Trans>Wallet {index + 1}</Trans>}
              </Typography>
            )}
            {!isRenaming && (
              <Typography variant="caption" color="textSecondary">
                {fingerprint}
              </Typography>
            )}
          </Flex>
        </Flex>
        <Box
          sx={{
            backgroundColor: color.main,
            borderTop: `1px solid ${color.main}`,
            padding: '5px',
          }}
        >
          {currentFingerprint === fingerprint && (
            <Box position="absolute" bottom={8} left={8}>
              <Chip
                size="small"
                sx={{
                  height: '22px',
                  paddingRight: '5px',
                  paddingTop: '1px',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  '> div': {
                    gap: '4px',
                  },
                  '> span': {
                    padding: '0 3px 0 1px',
                  },
                  span: {
                    fontSize: '10px',
                  },
                  '.checkmark-icon': {
                    g: {
                      circle: {
                        stroke: color.accent,
                      },
                      path: {
                        stroke: color.accent,
                        fill: color.accent,
                      },
                    },
                  },
                  '.reload-icon,.cancel-icon': {
                    g: {
                      circle: {
                        stroke: color.accent,
                      },
                      path: {
                        fill: color.accent,
                      },
                    },
                  },
                }}
                label={<WalletStatus variant="body2" indicator reversed color="textColor" />}
              />
            </Box>
          )}
          {renderOptions()}
        </Box>
      </Flex>
    </CardListItem>
  );
}
