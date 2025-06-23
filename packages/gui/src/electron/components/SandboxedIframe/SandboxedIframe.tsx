import React, { type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

export type SandboxIframeProps = {
  children: ReactNode;
  className?: string;
  isDarkMode?: boolean;
};

export default function SandboxedIframe(props: SandboxIframeProps) {
  const { children, className, isDarkMode = false } = props;

  const iframeContent = renderToStaticMarkup(
    <html className={isDarkMode ? 'dark' : ''}>
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
              img-src 'none';
              media-src 'none';
              object-src 'none';
              script-src 'none';
              style-src  asset:;
              worker-src 'none';
              form-action 'none';
            "
        />
      </head>
      <body>{children}</body>
    </html>,
  );

  const srcDocHTML = `<!DOCTYPE html>${iframeContent}`;

  return (
    <iframe
      sandbox=""
      title="Sandboxed Iframe"
      srcDoc={srcDocHTML}
      className={className}
      referrerPolicy="no-referrer"
    />
  );
}
