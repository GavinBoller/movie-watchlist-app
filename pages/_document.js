import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Add a version query string to bust the cache. You can change this value on subsequent updates. */}
        {/* Fallback icon for older browsers (.ico) */}
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        {/* Main icon for modern browsers (SVG) - will be preferred */}
        <link rel="icon" href="/app-icon.svg?v=2" type="image/svg+xml" />

        {/* Specific icon for "Add to Home Screen" on iPhone */}
        <link rel="apple-touch-icon" href="/app-icon.svg?v=2" />

        {/* Web App Manifest for PWA features */}
        <link rel="manifest" href="/manifest.json?v=2" />
        <meta name="theme-color" content="#1A1A1A" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}