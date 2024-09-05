/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
            'flowbite.com',
        ],
    },
    reactStrictMode: false,
    webpack: (config, { isServer }) => {
        // Aliasing `handlebars` to use the browser-friendly version
        config.resolve.alias['handlebars'] = 'handlebars/dist/handlebars.min.js';

        if (!isServer) {
            // Ensure server-side only modules are not included in client-side bundle
            config.resolve.fallback = {
                fs: false,
                module: false,
                process: false,
            };
        }

        // Adding handlebars-loader for `.handlebars` files
        config.module.rules.push({
            test: /\.handlebars$/,
            loader: 'handlebars-loader',
        });

        return config;
    },
};

export default nextConfig;
