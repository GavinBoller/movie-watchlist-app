/* pages/_document.js */
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* <meta name="description" content="Search and manage your movie and TV watchlist" /> */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
