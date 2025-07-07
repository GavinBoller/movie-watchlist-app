// @ts-nocheck
import { Html, Head, Main, NextScript } from 'next/document'
import React from 'react'

export default function Document(): React.ReactElement {
  return (
    <Html lang="en">
      <Head>
        {/*
          Add a version query string to bust the cache.
          You can change this value on subsequent updates.
        */}

        {/* Main icon for modern browsers (SVG) - will be preferred. */}
        <link rel="icon" href="/app-icon.svg?v=2" type="image/svg+xml" />

        {/* Specific sizes for different resolutions */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />

        {/* Specific icon for "Add to Home Screen" on Apple devices. */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />

        {/* Fallback for older browsers. `sizes="any"` helps modern browsers pick the best one. */}
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />

        {/* Web App Manifest for PWA features (references android-chrome icons). */}
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