import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* This is the main icon for browsers and other platforms */}
        <link rel="icon" href="/app-icon.svg" type="image/svg+xml" />
        
        {/* This is the specific icon for when you "Add to Home Screen" on an iPhone */}
        <link rel="apple-touch-icon" href="/app-icon.svg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}