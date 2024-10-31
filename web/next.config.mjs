import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [

    {
      urlPattern: /^https:\/\/localhost:3000\/.*$/, // Correct pattern
      handler: 'CacheFirst', // Cache first strategy for assets
      options: {
        cacheName: 'assets-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // Cache for 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css|html|png|jpg|jpeg|svg|gif)$/, // Cache specific file types
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // Cache for 30 days
        },
      },
    },
  ],
});

// Future configurations or additional settings can be added here
const additionalConfig = {
  reactStrictMode: true, // Strict mode settings
  swcMinify: true,            // Enable SWC minification for improved performance

  // Add any future options here...
};

const cors = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Credentials", value:"true"
          },
          {
            key: "Access-Control-Allow-Origin", value:"*"
          },
          {
            key: "Access-Control-Allow-Methods", value:"GET,OPTIONS,PATCH,DELETE,POST,PUT"
          },
          {
            key: "Access-Control-Allow-Headers", value:"X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization"
          },
        ]
      }
    ]
  }
}

// Merge PWA config with other Next.js configurations
const nextConfig = {
  ...pwaConfig,
  ...additionalConfig,
  ...cors,
  // You can add more config in the future if needed
};

export default nextConfig;
