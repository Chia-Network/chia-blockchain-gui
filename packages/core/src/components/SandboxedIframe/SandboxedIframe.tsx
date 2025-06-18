import React, { useState, memo, type ReactNode, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import styled from 'styled-components';

const StyledIframe = styled(({ isVisible, miniThumb, ...rest }) => <iframe {...rest} />)`
  position: relative;
  width: ${({ miniThumb }) => (miniThumb ? '50px' : '100%')};
  height: ${({ miniThumb }) => (miniThumb ? '50px' : '100%')};
  border-radius: ${({ miniThumb }) => (miniThumb ? '10px' : 0)};
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
`;

export type SandboxIframeProps = {
  height?: number | string;
  width?: number | string;
  onLoadedChange?: (loaded: boolean) => void;
  hideUntilLoaded?: boolean;
  allowPointerEvents?: boolean;
  miniThumb?: boolean;
  children: ReactNode;
};

function SandboxedIframe(props: SandboxIframeProps) {
  const {
    height = '300px',
    width,
    onLoadedChange,
    hideUntilLoaded = false,
    allowPointerEvents = false,
    miniThumb = false,
    children,
  } = props;

  const [loaded, setLoaded] = useState(false);

  function handleLoad() {
    setLoaded(true);
    onLoadedChange?.(true);
  }

  const srcDocHTML = useMemo(() => {
    const iframeContent = renderToStaticMarkup(
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta
            httpEquiv="Content-Security-Policy"
            content="
              default-src 'none';
              base-uri   'none';
              connect-src 'none';
              font-src   'none';
              frame-src  'none';   
              frame-ancestors 'none';
              img-src cache:;
              media-src cache:;
              object-src 'none';
              script-src 'none';
              style-src  'unsafe-inline';
              worker-src 'none';
              form-action 'none';
            "
          />
          <style>
            {`
              ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              
              ::-webkit-scrollbar-track {
                background: transparent;
              }
              
              ::-webkit-scrollbar-thumb {
                background: #888;
                border-radius: 4px;
              }
              
              ::-webkit-scrollbar-thumb:hover {
                background: #555;
              }
              
              body {
                margin: 0;
                padding: 0;
                overflow: auto;
              }
            `}
          </style>
        </head>
        <body>{children}</body>
      </html>,
    );

    return iframeContent;
  }, [children]);

  const isVisible = hideUntilLoaded ? loaded : true;

  return (
    <StyledIframe
      sandbox=""
      srcDoc={srcDocHTML}
      height={height}
      width={width}
      frameBorder="0"
      onLoad={handleLoad}
      isVisible={isVisible}
      allowFullScreen
      style={{ pointerEvents: allowPointerEvents ? 'auto' : 'none' }}
      miniThumb={miniThumb}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
}

export default memo(SandboxedIframe);
