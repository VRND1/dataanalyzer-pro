import React, { Suspense, lazy } from 'react';
import '../App.css';
import {} from '@mui/material';
import './home.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Lazy load subcomponents
const Features = lazy(() => import('./Features'));
const HowItWorks = lazy(() => import('./HowItWorks'));
const Audiences = lazy(() => import('./Audiences'));
const Pricing = lazy(() => import('./Pricing'));
const CTASection = lazy(() => import('./CTASection'));

const Footer = lazy(() => import('./Footer'));
const BackgroundAnimation = lazy(() => import('../components/ui/BackgroundAnimation'));

const Home: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode],
  );

  const LoadingSection = () => <div style={{ minHeight: 80, textAlign: 'center' }}>Loading...</div>;

  return (
    <ThemeProvider theme={theme}>
      <div className="bg-white min-h-screen">
        <Suspense fallback={<LoadingSection />}>
          <BackgroundAnimation />
        </Suspense>
        <Suspense fallback={<LoadingSection />}>
          <Features />
        </Suspense>
        <Suspense fallback={<LoadingSection />}>
          <HowItWorks />
        </Suspense>
        <Suspense fallback={<LoadingSection />}>
          <Audiences />
        </Suspense>
        <Suspense fallback={<LoadingSection />}>
          <Pricing />
        </Suspense>
        <Suspense fallback={<LoadingSection />}>
          <CTASection />
        </Suspense>

        <Suspense fallback={<LoadingSection />}>
          <Footer />
        </Suspense>
      </div>
    </ThemeProvider>
  );
};

export default Home; 
