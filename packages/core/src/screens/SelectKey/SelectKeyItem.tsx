import type { KeyData } from '@chia-network/api';
import { useGetLoggedInFingerprintQuery, useLocalStorage } from '@chia-network/api-react';
import { Trans } from '@lingui/macro';
import { Delete as DeleteIcon, Visibility as VisibilityIcon, Edit as EditIcon } from '@mui/icons-material';
import { Box, Typography, ListItemIcon, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';

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

export default function SelectKeyItem(props: SelectKeyItemProps) {
  const { keyData, onSelect, disabled, loading, index } = props;
  const openDialog = useOpenDialog();
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  const { data: currentFingerprint } = useGetLoggedInFingerprintQuery();

  const { fingerprint, label } = keyData;

  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [tempEmoji, setTempEmoji] = useState<string | null>(null);
  const [tempColor, setTempColor] = useState<string | null>(null);
  const [emoji, setEmoji] = useLocalStorage(`key-item-emoji-${keyData.fingerprint}`, null);

  const [background, setBackground] = useLocalStorage(`key-item-bg-${keyData.fingerprint}`, null);

  const theme: any = useTheme();

  function isColor(color: string) {
    return Object.keys(theme.palette.colors).includes(color);
  }
  const isDark = theme.palette.mode === 'dark';

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
              color: isColor(tempColor || background)
                ? theme.palette.colors[tempColor || background].accent
                : theme.palette.colors.default.accent,
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
        border: `1px solid ${
          isColor(tempColor || background)
            ? theme.palette.colors[tempColor || background].border
            : theme.palette.colors.default.border
        }`,
        ':hover': {
          border: `1px solid ${
            isColor(tempColor || background)
              ? theme.palette.colors[tempColor || background].border
              : theme.palette.colors.default.border
          }`,
        },
      }}
    >
      <Flex position="relative" flexDirection="column">
        <Flex sx={{ padding: '7px 10px 5px 10px' }} direction="row">
          <Flex sx={{ padding: '0 10px 0 0', fontSize: '24px', position: 'relative' }}>
            <span
              style={{ display: showEmojiPicker ? 'inline' : 'none', position: 'fixed', zIndex: 10 }}
              onClick={preventBubble}
            >
              {showEmojiPicker && (
                <EmojiAndColorPicker
                  onSelect={(result: any) => {
                    if (result === '') {
                      setTempEmoji(null);
                      setTempColor(null);
                    } else if (isColor(result)) {
                      setBackground(result);
                    } else if (result !== '') {
                      setEmoji(result);
                    }
                    setShowEmojiPicker(false);
                  }}
                  onClickOutside={() => {
                    setShowEmojiPicker(false);
                  }}
                  currentColor={background}
                  currentEmoji={emoji}
                  themeColors={theme.palette.colors}
                  isDark={isDark}
                  onSelectTempEmoji={(tEmoji: string) => {
                    setTempEmoji(tEmoji);
                  }}
                  onSelectTempColor={(tColor: string) => {
                    setTempColor(tColor);
                  }}
                />
              )}
            </span>
            <Flex
              sx={{
                zIndex: 9,
                ':hover': {
                  backgroundColor: theme.palette.colors[tempColor || background].main,
                },
                width: '40px',
                height: '40px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
              }}
              onClick={toggleEmojiPicker}
            >
              {tempEmoji || emoji || `⚪`}
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
              <SelectKeyRenameForm keyData={keyData} onClose={handleCloseRename} />
            ) : (
              <Typography variant="subtitle1" noWrap>
                {label || <Trans>Wallet {index + 1}</Trans>}
              </Typography>
            )}
            <Typography variant="caption" color="textSecondary">
              {fingerprint}
            </Typography>
          </Flex>
        </Flex>
        <Box
          sx={{
            backgroundColor: isColor(tempColor || background)
              ? theme.palette.colors[tempColor || background].main
              : theme.palette.colors.default.main,
            borderTop: `1px solid ${
              isColor(tempColor || background)
                ? theme.palette.colors[tempColor || background].main
                : theme.palette.colors.default.main
            }`,
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
                  svg: {
                    g: {
                      fill: isColor(tempColor || background)
                        ? theme.palette.colors[tempColor || background].accent
                        : theme.palette.colors.default.accent,
                      stroke: isColor(tempColor || background)
                        ? theme.palette.colors[tempColor || background].accent
                        : theme.palette.colors.default.accent,
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
