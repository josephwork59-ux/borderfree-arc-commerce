// External import
import Script from 'next/script';
import { ThemeProvider } from 'next-themes';

// Internal import
import { Navbar, Footer } from '../components';

import '../styles/globals.css';

const MyApp = ({ Component, pageProps }) => (
  <ThemeProvider attribute="class">
    <div className="dark:bg-nft-dark bg-white min-h-screen">
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </div>

    <Script src="https://kit.fontawesome.com/194d67c9bd.js" crossOrigin="anonymous" />
  </ThemeProvider>
);

export default MyApp;
