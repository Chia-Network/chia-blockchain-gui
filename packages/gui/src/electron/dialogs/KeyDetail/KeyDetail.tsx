import React from 'react';

import { i18n } from '../../../config/locales';

export type KeyDetailData = {
  index: number;
  label?: string;
  fingerprint: number;
  publicKey: string;
  farmerPublicKey: string;
  poolPublicKey: string;
  secretKey: string;
  seed?: string;
};

export type KeyDetailProps = {
  data: KeyDetailData;
};

export default function KeyDetail(props: KeyDetailProps) {
  const { data } = props;

  return (
    <div className="h-screen overflow-y-auto p-4 flex flex-col text-sm text-chia-text">
      <div className="mb-4">
        <h2 className="mt-0 mb-4 text-base">{data.label || `Wallet ${data.index + 1}`}</h2>
        <p className="mt-0 mb-4 text-chia-text-secondary">{data.fingerprint}</p>
      </div>

      <div className="grid gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <span className="text-chia-text-secondary">{i18n._(/* i18n */ { id: 'Public Key' })}</span>
          <span className="break-all">{data.publicKey}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-chia-text-secondary">{i18n._(/* i18n */ { id: 'Farmer Public Key' })}</span>
          <span className="break-all">{data.farmerPublicKey}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-chia-text-secondary">{i18n._(/* i18n */ { id: 'Pool Public Key' })}</span>
          <span className="break-all">{data.poolPublicKey}</span>
        </div>
      </div>

      <p className="text-red-500 dark:text-red-400 font-bold text-center my-4">
        {i18n._(/* i18n */ { id: 'NEVER SHARE THESE WITH ANYONE' })}
      </p>

      <div className="grid gap-4">
        <div className="border border-chia-border rounded-lg">
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
              <span className="text-chia-text-secondary">{i18n._(/* i18n */ { id: 'Secret Key' })}</span>
              <svg
                className="w-4 h-4 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="p-4 pt-0">
              <span className="break-all">{data.secretKey}</span>
            </div>
          </details>
        </div>

        <div className="border border-chia-border rounded-lg">
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
              <span className="text-chia-text-secondary">{i18n._(/* i18n */ { id: 'Seed Phrase' })}</span>
              <svg
                className="w-4 h-4 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="p-4 pt-0">
              <span className="break-all">{data.seed || 'No 24 word seed, since this key is imported.'}</span>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
