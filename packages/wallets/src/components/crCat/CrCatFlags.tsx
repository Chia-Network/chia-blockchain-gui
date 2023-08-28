import { useGetVCListQuery } from '@chia-network/api-react';
import { Flex } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import DoneIcon from '@mui/icons-material/Done';
import ErrorIcon from '@mui/icons-material/Error';
import { Chip } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import { camelCase } from 'lodash';
import React, { useMemo } from 'react';

type Props = {
  restrictions?: {
    authorizedProviders: string[];
    flags: string[];
  };
};

export default function CrCatFlags(props: Props) {
  const { restrictions } = props;

  const { data: vcs, isLoading: isGetVCListLoading } = useGetVCListQuery({});

  const haveValidCredentialsForFlags = useMemo(() => {
    if (isGetVCListLoading || !restrictions?.flags || restrictions.flags.length === 0 || !vcs || !vcs.proofs) {
      return null;
    }

    // since the flags are the keys, the API abstraction camelCases them
    const flags = restrictions.flags.map((flag) => ({ flag, flagCamelCase: camelCase(flag) }));

    const toReturn: string[] = [];

    Object.entries(vcs.proofs).forEach(([proofHash, proofObject]) => {
      Object.keys(proofObject).forEach((proofFlag) => {
        // check if we have the proof flag
        const foundFlag = flags.find((flag) => flag.flagCamelCase === proofFlag);
        if (foundFlag) {
          // check if we have a VC with the proofHash
          vcs.vcRecords.forEach((vcRecord) => {
            if (vcRecord.vc.proofHash === `0x${proofHash}`) {
              // check if the VC is from the authorized provider
              // TODO remove .map() line after backend change
              if (
                restrictions.authorizedProviders
                  .map((provider) => (provider.startsWith('0x') ? provider : `0x${provider}`))
                  .includes(vcRecord.vc.proofProvider)
              ) {
                toReturn.push(foundFlag.flag);
              }
            }
          });
        }
      });
    });

    return toReturn;
  }, [isGetVCListLoading, restrictions, vcs]);

  return (
    <Flex gap={2}>
      {restrictions?.flags.map((flagName) => {
        const haveValidCredential = haveValidCredentialsForFlags?.includes(flagName);

        return (
          <Tooltip
            title={
              haveValidCredential ? (
                <Trans>You have this verifiable credential from the correct authorized provider</Trans>
              ) : (
                <Trans>
                  You do not have this verifiable credential or it is not from the correct authorized provided
                </Trans>
              )
            }
          >
            <Chip
              icon={haveValidCredential ? <DoneIcon /> : <ErrorIcon />}
              label={flagName}
              color={haveValidCredential ? 'primary' : 'default'}
            />
          </Tooltip>
        );
      })}
    </Flex>
  );
}
