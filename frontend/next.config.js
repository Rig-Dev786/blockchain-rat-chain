/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Fix missing optional peer deps from wagmi / walletconnect ecosystem
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
      '@react-native-async-storage/async-storage': false,
      fs: false,
      net: false,
      tls: false,
    }
    return config
  },
}

module.exports = nextConfig
