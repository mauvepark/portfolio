#!/usr/bin/env node
// Turns the admin password into the ADMIN_PASSWORD_HASH value, so the password itself is never
// stored anywhere. Run: npm run admin:hash  (the password is typed hidden and never printed).
import { randomBytes, scryptSync } from 'node:crypto';
import { createPrompt } from './prompt.mjs';

const prompt = createPrompt();
const password = await prompt.ask('Admin password (hidden): ', { hidden: true });
const confirm = await prompt.ask('Same again to confirm: ', { hidden: true });
prompt.close();
if (password !== confirm) { console.error('Passwords did not match.'); process.exit(1); }
if (password.length < 16) console.warn('Heads up: use 16+ characters (a password manager can generate one).');

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
console.log('\nAdd this line to .env.local and to Vercel → Settings → Environment Variables:\n');
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString('base64')}:${hash.toString('base64')}`);
