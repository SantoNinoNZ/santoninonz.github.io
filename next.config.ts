import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Forces /about to become /about/index.html 
  // This is much more reliable for GitHub Pages routing
  trailingSlash: true, 
  
  // Explicitly tell Next where to put the build (matches your YAML path)
  distDir: 'out', 
  
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;