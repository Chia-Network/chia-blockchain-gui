import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import icon from '../../assets/img/chia_circle.png';

const StyledBody = styled.body`
  text-align: center;
`;

const StyledLogoContainer = styled.div`
  margin-bottom: 1rem;
`;

const GlobalStyle = createGlobalStyle`
  html {
    background-color: silver;
  }
`;

console.log('icon', icon);

type Props = {
  version: string;
  packageJson: {
    productName: string;
    description: string;
  };
  versions: {
    [key: string]: string;
  };
};

export default function About(props: Props) {
  const {
    version,
    packageJson: {
      productName,
      description,
    },
    versions,
  } = props;

  return (
    <html>
      <head>
        <base href="./" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, minimum-scale=1.0, initial-scale=1, user-scalable=yes" />
        <title>About {productName}</title>
      </head>
      <StyledBody>
        <GlobalStyle />
        <StyledLogoContainer>
          <img src={`./${icon}`} height="200" />
        </StyledLogoContainer>

        <h2 className="title">{productName} {version}</h2>
        <h3 className="description">{description}</h3>
        <div className="copyright">
          Copyright (c) 2021 Chia Network
        </div>
        <table className="versions">
          {versions?.electron && (
            <tr>
              <td>Electron</td>
              <td>{versions?.electron}</td>
            </tr>
          )}
          {versions?.chrome && (
            <tr>
              <td>Chrome</td>
              <td>{versions?.chrome}</td>
            </tr>
          )}
          {versions?.node && (
            <tr>
              <td>Node</td>
              <td>{versions?.node}</td>
            </tr>
          )}
          {versions?.v8 && (
            <tr>
              <td>V8</td>
              <td>{versions?.v8}</td>
            </tr>
          )}
        </table>
        <div className="buttons"></div>
        <footer className="footer">
          <div className="link bug-report-link">
            <a href="https://github.com/Chia-Network/chia-blockchain/issues" target="_blank">
              Report an issue
            </a>
          </div>
        </footer>
        {'{{CSS}}'}
      </StyledBody>
    </html>
  );
}