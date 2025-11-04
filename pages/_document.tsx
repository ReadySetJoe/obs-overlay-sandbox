import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang='en'>
      <Head>
        {/* Basic Meta Tags */}
        <meta charSet='utf-8' />
        <meta
          name='description'
          content='Professional Joeverlay for Twitch with real-time customization. Create custom OBS overlays with chat highlights, alerts, Spotify Now Playing, countdown timers, weather effects, and more.'
        />
        <meta
          name='keywords'
          content='twitch overlay, OBS overlay, stream overlay, streaming tools, twitch alerts, chat overlay, spotify overlay, stream customization, OBS browser source, twitch streaming'
        />
        <meta name='author' content='Joeverlay' />
        <meta name='theme-color' content='#9333ea' />

        {/* Favicon */}
        <link rel='icon' href='/favicon.ico' />
        <link rel='apple-touch-icon' href='/logo.png' />

        {/* Open Graph Meta Tags */}
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='Joeverlay - Professional OBS Overlays for Twitch'
        />
        <meta
          property='og:description'
          content='Create and customize professional stream overlays with live Twitch chat integration, Spotify Now Playing, countdown timers, alerts, weather effects, and 18+ color themes. Real-time WebSocket synchronization for OBS.'
        />
        <meta property='og:image' content='/title.png' />
        <meta property='og:site_name' content='Joeverlay' />

        {/* Twitter Card Meta Tags */}
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Joeverlay - Professional OBS Overlays for Twitch'
        />
        <meta
          name='twitter:description'
          content='Create and customize professional stream overlays with live Twitch chat integration, Spotify Now Playing, countdown timers, alerts, and more.'
        />
        <meta name='twitter:image' content='/title.png' />

        {/* Google Fonts for overlay customization */}
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&family=Roboto:wght@400;500;700;900&family=Montserrat:wght@400;500;600;700;800;900&family=Bebas+Neue&family=Orbitron:wght@400;500;600;700;800;900&family=Press+Start+2P&family=Righteous&family=Bangers&family=Permanent+Marker&family=Pacifico&family=Anton&family=Archivo+Black&family=Fredoka:wght@400;500;600;700&family=Titan+One&display=swap'
          rel='stylesheet'
        />
      </Head>
      <body className='antialiased'>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
