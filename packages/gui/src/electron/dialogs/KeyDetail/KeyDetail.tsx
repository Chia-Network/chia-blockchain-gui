import React from 'react';

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
    <div className="p-4 flex flex-col text-gray-900 dark:text-gray-100">
      <div className="mb-4">
        <h2 className="mt-0 mb-4 text-base">{data.label || `Wallet ${data.index + 1}`}</h2>
        <p className="mt-0 mb-4 text-gray-500 dark:text-gray-400">{data.fingerprint}</p>
      </div>

      <div className="grid gap-4 mb-4">
        <div className="flex flex-col gap-1">
          <span className="text-gray-500 dark:text-gray-400">Public Key</span>
          <span className="break-all">{data.publicKey}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-gray-500 dark:text-gray-400">Farmer Public Key</span>
          <span className="break-all">{data.farmerPublicKey}</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-gray-500 dark:text-gray-400">Pool Public Key</span>
          <span className="break-all">{data.poolPublicKey}</span>
        </div>
      </div>

      <p className="text-red-500 dark:text-red-400 font-bold text-center my-4">NEVER SHARE THESE WITH ANYONE</p>

      <div className="grid gap-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
              <span className="text-gray-500 dark:text-gray-400">Secret Key</span>
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

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
              <span className="text-gray-500 dark:text-gray-400">Seed Phrase</span>
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
