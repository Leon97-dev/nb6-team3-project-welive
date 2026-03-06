import type { NextConfig } from 'next';
import type { Configuration } from 'webpack';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['sprint-be-project.s3.ap-northeast-2.amazonaws.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/upload/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/upload/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3004',
        pathname: '/upload/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3004',
        pathname: '/upload/**',
      },
    ],
  },
  webpack(config: Configuration) {
    config.module?.rules?.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;
