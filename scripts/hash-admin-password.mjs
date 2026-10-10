#!/usr/bin/env node
// Turns the admin password into the ADMIN_PASSWORD_HASH value, so the password itself is never
// stored anywhere. Run: npm run admin:hash  (the password is typed hidden and never printed).
import { randomBytes, scryptSync } from 'node:crypto';
import readline from 'node:readline';

function askHidden(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(prompt)) process.stdout.write(s); }; // hide typed characters
    rl.question(prompt, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}

const password = await askHidden('Admin password (hidden): ');
const confirm = await askHidden('Same again to confirm: ');
if (password !== confirm) { console.error('Passwords did not match.'); process.exit(1); }
if (password.length < 16) console.warn('Heads up: use 16+ characters (a password manager can generate one).');

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
console.log('\nAdd this line to .env.local and to Vercel → Settings → Environment Variables:\n');
console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt.toString('base64')}:${hash.toString('base64')}`);
