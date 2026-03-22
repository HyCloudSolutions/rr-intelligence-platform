import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://restaurantrisk-prod-alb-223501911.us-east-1.elb.amazonaws.com/:path*',
      },
    ];
  },
};



export default nextConfig;

