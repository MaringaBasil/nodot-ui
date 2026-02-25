import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web document root — injected only on Expo Web builds.
 * Global CSS strips browser selection artefacts (tap highlight, text-select
 * cursors on icon glyphs) so the UI feels native on all platforms.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        {/* Reset ScrollView body styles for Expo Router */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalWebCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalWebCss = `
  /* Suppress browser tap highlight (blue flash on mobile web) */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* Prevent text/icon selection everywhere — this is a native-style app */
  * {
    user-select: none;
    -webkit-user-select: none;
  }

  /* Re-enable selection inside text inputs */
  input, textarea, [contenteditable] {
    user-select: text;
    -webkit-user-select: text;
  }

  /* Remove browser focus outlines on click; keyboard focus still works */
  *:focus:not(:focus-visible) {
    outline: none;
  }

  /* Pointer cursor on interactive elements */
  button, [role="button"] {
    cursor: pointer;
  }

  /* ── Mobile-first frame ────────────────────────────────────────────────
     Constrains the app to a phone-width container centered on desktop.
     The dark shell background makes it clear this is a mobile app.     */
  html, body {
    background: #0a0e14 !important;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    margin: 0;
    padding: 0;
  }

  body > div:first-child {
    width: 100%;
    max-width: 430px;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.06),
      0 24px 80px rgba(0,0,0,0.7);
  }
`;
