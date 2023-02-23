import type { KeyData } from '@chia-network/api';
import { useGetLoggedInFingerprintQuery, useLocalStorage } from '@chia-network/api-react';
import { Trans } from '@lingui/macro';
import { Delete as DeleteIcon, Visibility as VisibilityIcon, Edit as EditIcon } from '@mui/icons-material';
import { Box, Typography, ListItemIcon, Chip } from '@mui/material';
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

  const [emoji, setEmoji] = useLocalStorage(`key-item-emoji-${keyData.fingerprint}`, null);
  const [background, setBackground] = useLocalStorage(`key-item-bg-${keyData.fingerprint}`, null);

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
      <Flex flexDirection="column" alignItems="flex-end" gap={0.5}>
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
    >
      <Flex position="relative" flexDirection="column">
        <Flex sx={{ padding: '10px 10px 5px 10px' }} direction="row">
          <Flex sx={{ padding: '0 12px 0 1px', fontSize: '24px', position: 'relative' }}>
            <span
              style={{ display: showEmojiPicker ? 'inline' : 'none', position: 'fixed', zIndex: 10 }}
              onClick={preventBubble}
            >
              {showEmojiPicker && (
                <EmojiAndColorPicker
                  onSelect={(result: any) => {
                    if (result.indexOf('#') === 0) {
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
                />
              )}
            </span>
            <span style={{ zIndex: 9 }} onClick={toggleEmojiPicker}>
              {emoji || `🍏`}
            </span>
          </Flex>
          <Flex
            direction="column"
            gap={isRenaming ? 1 : 0}
            minWidth={0}
            flexGrow={1}
            sx={{
              ' > h6': {
                lineHeight: 1.2,
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
        <Box sx={{ backgroundColor: background || '#CFDDE0', padding: '5px' }}>
          {currentFingerprint === fingerprint && (
            <Box position="absolute" bottom={8} left={8}>
              <Chip
                size="small"
                sx={{
                  height: '22px',
                  paddingRight: '5px',
                  paddingTop: '1px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                  '> div': {
                    gap: '4px',
                  },
                  '> span': {
                    padding: '0 3px 0 1px',
                  },
                  span: {
                    fontSize: '10px',
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
