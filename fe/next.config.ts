// import dotenv from "dotenv";

// dotenv.config();
// console.log("Loaded env vars in next.config.mjs:", process.env.NEXT_PUBLIC_PROJECT_ID);
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   experimental: {
//       serverSourceMaps: true,
//   },
//   env: {
//     NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
//   },
//   webpack: (config, { isServer }) => {
//       if(!isServer) {
//         config.resolve.fallback = { 
//           fs: false, 
//           // net: false, 
//           // tls: false 
//         };
//        }
//       config.externals.push('pino-pretty', 'lokijs', 'encoding')
//       return config;
//   },
// };

// export default nextConfig;


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    CELOSCAN_API: process.env.CELOSCAN_API,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;