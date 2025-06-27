import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Fallback icon for older browsers (.ico) */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Main icon for modern browsers (SVG) - will be preferred */}
        <link rel="icon" href="/app-icon.svg" type="image/svg+xml" />

        {/* Specific icon for "Add to Home Screen" on iPhone */}
        <link rel="apple-touch-icon" href="/app-icon.svg" />

        {/* Web App Manifest for PWA features */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1A1A1A" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}