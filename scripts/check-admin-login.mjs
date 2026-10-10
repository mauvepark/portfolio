#!/usr/bin/env node
// Checks a username + password against ADMIN_USERNAME / ADMIN_PASSWORD_HASH in .env.local and says
// which part matches. Nothing secret is printed. Run: npm run admin:check
import { scryptSync, timingSafeEqual } from 'node:crypto';
import nextEnv from '@next/env';
import { createPrompt } from './prompt.mjs';

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error: console.error });

const envUser = process.env.ADMIN_USERNAME?.trim();
const envHash = process.env.ADMIN_PASSWORD_HASH?.trim();
if (!envUser || !envHash?.startsWith('scrypt:')) {
  console.log('ADMIN_USERNAME / ADMIN_PASSWORD_HASH are missing or malformed in .env.local.');
  process.exit(1);
}

const prompt = createPrompt();
const username = await prompt.ask('Username: ');
const password = await prompt.ask('Password (hidden): ', { hidden: true });
prompt.close();
const [, salt, expected] = envHash.split(':');
const actual = scryptSync(password, Buffer.from(salt, 'base64'), 64);
const exp = Buffer.from(expected, 'base64');

console.log(`\nUsername matches: ${username.trim().toLowerCase() === envUser.toLowerCase() ? 'yes' : 'NO'}`);
console.log(`Password matches: ${actual.length === exp.length && timingSafeEqual(actual, exp) ? 'yes' : 'NO'}`);
console.log(`(password length typed: ${password.length})`);
