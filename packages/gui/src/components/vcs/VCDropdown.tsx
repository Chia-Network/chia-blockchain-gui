import { useGetVCListQuery, usePrefs } from '@chia-network/api-react';
import { DropdownActions, DropdownActionsProps, MenuItem } from '@chia-network/core';
import { t, Trans } from '@lingui/macro';
import { PermIdentity as PermIdentityIcon } from '@mui/icons-material';
import { ListItemIcon } from '@mui/material';
import React, { useMemo } from 'react';

type VCDropdownProps = DropdownActionsProps & {
  vcLauncherId?: string;
  onChange?: (newVCLauncherId?: string) => void;
  defaultTitle?: string | React.ReactElement;
  includeNoneOption?: boolean;
};

export default function VCDropdown(props: VCDropdownProps) {
  const { vcLauncherId, onChange, defaultTitle = t`All Credentials`, includeNoneOption = false, ...rest } = props;
  const { isLoading, data: vcs } = useGetVCListQuery({});
  const [vcTitlesObject] = usePrefs<any>('verifiable-credentials-titles', {});

  const { filteredEntries: vcEntries, allEntries } = useMemo(() => {
    if (isLoading || !vcs || !vcs.vcRecords) {
      return { filteredEntries: [], allEntries: [] };
    }

    const entries = vcs.vcRecords.map((vcRecord) => ({
      launcherId: vcRecord.vc.launcherId.replace(/^0x/, ''),
      innerPuzzleHash: vcRecord.vc.innerPuzzleHash,
      title: vcTitlesObject[vcRecord.vc.launcherId] || vcTitlesObject[vcRecord.sha256] || t`Verifiable Credential`,
    }));

    return {
      filteredEntries: entries.filter((entry) => entry.launcherId !== vcLauncherId),
      allEntries: entries,
    };
  }, [isLoading, vcs, vcTitlesObject, vcLauncherId]);

  const label = useMemo(() => {
    if (isLoading) {
      return t`Loading...`;
    }

    if (!vcLauncherId || !allEntries) {
      return defaultTitle;
    }

    const entry = allEntries.find((vcEntry) => vcEntry.launcherId === vcLauncherId);

    return entry?.title || defaultTitle;
  }, [isLoading, allEntries, vcLauncherId, defaultTitle]);

  function handleVCChange(newVCLauncherId?: string) {
    onChange?.(newVCLauncherId);
  }

  return (
    <DropdownActions onSelect={handleVCChange} label={label} variant="text" color="secondary" size="large" {...rest}>
      {(vcEntries ?? []).map((vcEntry) => (
        <MenuItem
          key={vcEntry.launcherId}
          onClick={() => handleVCChange(vcEntry.launcherId)}
          value={vcEntry.launcherId}
          selected={vcLauncherId === vcEntry.launcherId}
          data-testid={`VCDropdown-${vcEntry.launcherId}`}
          title={vcEntry.title}
        >
          <ListItemIcon>
            <PermIdentityIcon />
          </ListItemIcon>
          {vcEntry.title}
        </MenuItem>
      ))}
      {includeNoneOption && (
        <MenuItem key="<none>" onClick={() => handleVCChange()} selected={!vcLauncherId} close>
          <ListItemIcon>
            <PermIdentityIcon />
          </ListItemIcon>
          <Trans>None</Trans>
        </MenuItem>
      )}
    </DropdownActions>
  );
}
