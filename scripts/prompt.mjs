// One readline interface for every question (separate interfaces can swallow each other's input),
// with optional hidden echo for passwords.
import readline from 'node:readline';

export function createPrompt() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  let muted = false;
  const write = rl._writeToOutput.bind(rl);
  rl._writeToOutput = (s) => { if (!muted || s.includes('\n') || s.includes('\r')) write(muted ? '' : s); };
  const lines = [];
  let waiting = null;
  rl.on('line', (line) => (waiting ? (waiting(line), (waiting = null)) : lines.push(line)));
  return {
    ask(question, { hidden = false } = {}) {
      process.stdout.write(question);
      muted = hidden;
      return new Promise((resolve) => {
        const done = (answer) => { muted = false; if (hidden) process.stdout.write('\n'); resolve(answer); };
        lines.length ? done(lines.shift()) : (waiting = done);
      });
    },
    close: () => rl.close(),
  };
}
