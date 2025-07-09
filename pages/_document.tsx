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
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" />

        {/* Fallback for older browsers. `sizes="any"` helps modern browsers pick the best one. */}
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />

        {/* Web App Manifest for PWA features (references android-chrome icons). */}
        <link rel="manifest" href="/manifest.json?v=3" />
        
        {/* iOS PWA specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Movie Watchlist" />
        
        {/* Add to home screen for Safari on iOS */}
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-2048-2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1668-2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1536-2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1242-2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-1125-2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-750-1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/apple-splash-640-1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Permissions Policy to allow microphone access */}
        <meta httpEquiv="Permissions-Policy" content="microphone=*" />
        <meta name="theme-color" content="#1A1A1A" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}