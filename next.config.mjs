/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // CRUCIAAL: Dit zorgt voor de statische HTML-bestanden voor GitHub Pages
  basePath: '/budgeting-app', // Zorgt ervoor dat alle links en scripts goed laden op GitHub
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
