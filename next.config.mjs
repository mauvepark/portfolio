import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A stray package-lock.json in the home folder otherwise makes Next pick the wrong workspace root.
  outputFileTracingRoot: root,
  // Lets a verification build (NEXT_DIST_DIR=.next-build) run without clobbering a running dev server.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};
export default nextConfig;
