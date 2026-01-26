import Befunge from "befunge93";

process.stdin.setEncoding("utf8");

let input = "";
process.stdin.on("data", chunk => input += chunk);

process.stdin.on("end", () => {
  const { code, testInput } = JSON.parse(input);

  const befunge = new Befunge();
  let output = "";

  befunge.onOutput = c => output += c;

  let idx = 0;
  befunge.onInput = () => {
    if (idx < testInput.length) {
      return testInput.charCodeAt(idx++);
    }
    return -1;
  };

  try {
    befunge.run(code);
    process.stdout.write(output);
    process.exit(0);
  } catch (e) {
    process.stderr.write(e.message);
    process.exit(1);
  }
});
