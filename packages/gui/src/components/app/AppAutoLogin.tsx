import { useGetKeysQuery, useGetLoggedInFingerprintQuery } from '@chia-network/api-react';
import { LayoutLoading } from '@chia-network/core';
import { Trans } from '@lingui/macro';
import React, { useCallback, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdate } from 'react-use';

import useEnableAutoLogin from '../../hooks/useEnableAutoLogin';

export type AppAutoLoginProps = {
  children: ReactNode;
};

let isReady = false;

export default function AppAutoLogin(props: AppAutoLoginProps) {
  const { children } = props;
  const update = useUpdate();
  const navigate = useNavigate();
  const [enableAutoLogin] = useEnableAutoLogin();
  const { data: fingerprint, isLoading: isLoadingFingerprint } = useGetLoggedInFingerprintQuery();
  const { data: publicKeyFingerprints, isLoading: isLoadingPublicKeys } = useGetKeysQuery();
  const havePublicKeysResponse = publicKeyFingerprints !== undefined;
  const isLoading = isLoadingFingerprint || isLoadingPublicKeys;

  const processFingerprint = useCallback(() => {
    if (isLoading || isReady) {
      return;
    }

    if (fingerprint || havePublicKeysResponse) {
      isReady = true;
    }

    if (fingerprint && enableAutoLogin) {
      navigate('/dashboard/wallets');
    }

    update();
  }, [isLoading, havePublicKeysResponse, fingerprint, enableAutoLogin, navigate, update]);

  useEffect(() => {
    processFingerprint();
  }, [processFingerprint]);

  if (!isReady) {
    return (
      <LayoutLoading>
        <Trans>Loading fingerprint</Trans>
      </LayoutLoading>
    );
  }

  return <>{children}</>;
}
