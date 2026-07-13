import type { NextConfig } from 'next';
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
const config: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: isGitHubPages ? '/oners_game_rank' : '',
  assetPrefix: isGitHubPages ? '/oners_game_rank/' : undefined,
};
export default config;
