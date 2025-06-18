import React from 'react';

import icon from '../../../assets/img/chia_circle.svg';

const chiaUrl = 'https://chia.net';

export type AboutProps = {
  version: string;
  packageJson: {
    productName: string;
    description: string;
  };
  versions: {
    [key: string]: string;
  };
};

export default function About(props: AboutProps) {
  const {
    version,
    packageJson: { productName, description },
    versions,
  } = props;

  const currentYear = new Date().getFullYear();

  return (
    <div className="p-4 flex flex-col justify-center items-center text-gray-900 dark:text-gray-100">
      <a href={chiaUrl} className="no-underline text-inherit hover:no-underline">
        <div className="w-[200px] mx-auto">
          <img src={icon as unknown as string} alt="Chia Logo" className="h-[200px] mb-8" />
        </div>

        <h2 className="mt-0 mb-4">
          {productName} {version}
        </h2>
      </a>
      <h3 className="mt-0 mb-4">{description}</h3>
      <div className="mb-4" />
      <div>Copyright (c) {currentYear} Chia Network</div>
      <div className="mb-4" />
      <table className="border-collapse text-gray-500 dark:text-gray-400 text-xs">
        {versions?.electron && (
          <tr>
            <td className="pr-4">Electron</td>
            <td>{versions?.electron}</td>
          </tr>
        )}
        {versions?.chrome && (
          <tr>
            <td className="pr-4">Chrome</td>
            <td>{versions?.chrome}</td>
          </tr>
        )}
        {versions?.node && (
          <tr>
            <td className="pr-4">Node</td>
            <td>{versions?.node}</td>
          </tr>
        )}
        {versions?.v8 && (
          <tr>
            <td className="pr-4">V8</td>
            <td>{versions?.v8}</td>
          </tr>
        )}
      </table>

      <a
        href="https://github.com/Chia-Network/chia-blockchain/issues"
        className="absolute right-2 bottom-2 text-blue-500 dark:text-blue-400"
      >
        Report an issue
      </a>
    </div>
  );
}
