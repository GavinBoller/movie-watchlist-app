import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Main icon for modern browsers (SVG) */}
        <link rel="icon" href="/app-icon.svg" type="image/svg+xml" />

        {/* Fallback icon for older browsers (.ico) */}
        <link rel="alternate icon" href="/favicon.ico" />

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