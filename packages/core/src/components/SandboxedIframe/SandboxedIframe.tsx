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
              img-src cache:;
              media-src cache:;
              object-src 'none';
              script-src 'none';
              style-src  'unsafe-inline';
              worker-src 'none';
              form-action 'none';
            "
          />
        </head>
        <body>{children}</body>
      </html>,
    );

    return iframeContent;
  }, [children]);

  // generate a unique key when content changes - electron do not rerender iframe when srcDocHTML changes
  // eslint-disable-next-line react-hooks/exhaustive-deps -- We want to regenerate key when srcDocHTML changes
  const uniqueKey = useMemo(() => crypto.randomUUID(), [srcDocHTML]);

  const isVisible = hideUntilLoaded ? loaded : true;

  return (
    <StyledIframe
      sandbox=""
      srcDoc={srcDocHTML}
      key={uniqueKey}
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
