/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@tiptap/react',
      '@xyflow/react',
    ],
  },
};

export default nextConfig;
