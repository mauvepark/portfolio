// One readline interface for every question (separate interfaces can swallow each other's input).
// Uses readline's own prompt so the question stays on screen while typing, hides typed characters
// for passwords, and re-asks on empty answers (e.g. a stray Enter or a pasted trailing newline).
import readline from 'node:readline';

export function createPrompt() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  let question = '';
  let muted = false;
  const write = rl._writeToOutput.bind(rl);
  rl._writeToOutput = (s) => {
    if (!muted) return write(s);
    // While hidden, keep redraws of the question itself but drop the typed characters after it.
    const i = s.indexOf(question);
    if (i !== -1) write(s.slice(0, i + question.length));
  };

  const queue = [];
  let waiting = null;
  rl.on('line', (line) => {
    const answer = line.trim();
    if (!answer) return rl.prompt(); // ignore empty lines
    if (waiting) {
      const resolve = waiting;
      waiting = null;
      resolve(answer);
    } else queue.push(answer);
  });

  return {
    ask(q, { hidden = false } = {}) {
      question = q;
      muted = hidden;
      rl.setPrompt(q);
      rl.prompt();
      return new Promise((resolve) => {
        const done = (answer) => { muted = false; resolve(answer); };
        queue.length ? done(queue.shift()) : (waiting = done);
      });
    },
    close: () => rl.close(),
  };
}
