import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public', // Service worker generation destination
  register: true, // Auto register service worker
  skipWaiting: true, // Skip waiting and activate new SW
});

// Future configurations or additional settings can be added here
const additionalConfig = {
  reactStrictMode: true, // Strict mode settings
  swcMinify: true,            // Enable SWC minification for improved performance

  // Add any future options here...
};

// Merge PWA config with other Next.js configurations
const nextConfig = {
  ...pwaConfig,
  ...additionalConfig,
  // You can add more config in the future if needed
};

export default nextConfig;
