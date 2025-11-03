import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang='en'>
      <Head>
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
