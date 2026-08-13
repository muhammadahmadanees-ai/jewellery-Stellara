/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow Next.js to optimize images served from Supabase Storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'demctbygmsrlycyaewwy.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Aggressive caching: browsers cache optimized images for 1 year
    minimumCacheTTL: 31536000,
    // Serve modern formats (60-80% smaller, visually identical)
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;

