import { Loading } from '@chia-network/core';
import { Fees } from '@chia-network/icons';
import { useWallet } from '@chia-network/wallets';
import { Trans } from '@lingui/macro';
import React from 'react';
import { useFieldArray } from 'react-hook-form';

import useOfferBuilderContext from '../../hooks/useOfferBuilderContext';
import useStandardWallet from '../../hooks/useStandardWallet';
import OfferBuilderSection from './OfferBuilderSection';
import OfferBuilderValue from './OfferBuilderValue';
import OfferBuilderWalletBalance from './OfferBuilderWalletBalance';

export type OfferBuilderFeeSectionProps = {
  name: string;
  offering?: boolean;
  viewer?: boolean;
};

export default function OfferBuilderFeeSection(props: OfferBuilderFeeSectionProps) {
  const { name, offering, viewer } = props;
  const { wallet, loading } = useStandardWallet();
  const { imported, state } = useOfferBuilderContext();
  const { unit = '' } = useWallet(wallet?.id);

  const hideBalance = !offering;

  const { fields, append, remove } = useFieldArray({
    name,
  });

  function handleAdd() {
    if (!fields.length) {
      append({
        amount: '',
      });
    }
  }

  function handleRemove(index: number) {
    remove(index);
  }

  const canAdd =
    (!fields.length && state === undefined && !viewer) || // If in builder mode, or in viewer mode when offer hasn't been accepted
    (viewer && imported && !offering); // If in viewer mode when offer has not been accepted and showing the requesting side
  const disableReadOnly = offering && viewer && imported;
  const expanded = !!fields.length; // Fee section is expanded if there is a field value set. Could be ''.

  return (
    <OfferBuilderSection
      icon={<Fees color="info" />}
      title={<Trans>Fees</Trans>}
      subtitle={<Trans>Optional network fee to expedite acceptance of your offer</Trans>}
      onAdd={canAdd ? handleAdd : undefined}
      expanded={expanded}
      disableReadOnly={disableReadOnly}
    >
      {loading ? (
        <Loading />
      ) : (
        fields.map((field, index) => (
          <OfferBuilderValue
            key={field.id}
            type="fee"
            label={<Trans>Transaction Speed</Trans>}
            caption={!hideBalance && <OfferBuilderWalletBalance walletId={wallet?.id} />}
            name={`${name}.${index}.amount`}
            symbol={unit}
            onRemove={() => handleRemove(index)}
            disableReadOnly={disableReadOnly}
          />
        ))
      )}
    </OfferBuilderSection>
  );
}
