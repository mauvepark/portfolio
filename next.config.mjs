import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A stray package-lock.json in the home folder otherwise makes Next pick the wrong workspace root.
  outputFileTracingRoot: root,
};
export default nextConfig;
