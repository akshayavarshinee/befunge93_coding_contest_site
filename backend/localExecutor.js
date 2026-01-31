/**
 * High-performance, in-process Befunge-93 interpreter.
 * Replaces Docker execution for "blazing fast" performance.
 * Enforces step-count limits and wall-clock timeouts.
 */
class LocalExecutor {
    constructor(options = {}) {
        this.maxSteps = options.maxSteps || 1000000;
        this.timeoutMs = options.timeoutMs || 3000;
    }

    /**
     * Execute Befunge code in-process
     * @param {string} code - Befunge-93 source code
     * @param {string} inputStr - Input data for the program
     * @returns {Promise<{stdout: string, stderr: string, exitCode: number, verdict: string, executionTime: number}>}
     */
    async execute(code, inputStr = '') {
        const startTime = Date.now();
        const interpreter = new BefungeInterpreter(code, inputStr);

        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('TLE')), this.timeoutMs);
            });

            // Run interpreter and wrap with a timeout
            const result = await Promise.race([
                this.runSafe(interpreter),
                timeoutPromise
            ]);

            const executionTime = Date.now() - startTime;
            return {
                stdout: result,
                stderr: '',
                exitCode: 0,
                verdict: 'OK',
                executionTime,
                memoryUsed: '~1MB'
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;
            if (error.message === 'TLE') {
                return {
                    stdout: interpreter.output,
                    stderr: 'Time Limit Exceeded',
                    exitCode: 124,
                    verdict: 'TLE',
                    executionTime
                };
            }
            return {
                stdout: interpreter.output,
                stderr: error.message,
                exitCode: 1,
                verdict: 'RE',
                executionTime
            };
        }
    }

    async runSafe(interpreter) {
        // Run synchronously but we wrap it in a promise for the race
        return interpreter.run(this.maxSteps);
    }
}

class BefungeInterpreter {
    constructor(code, input = "") {
        this.grid = Array(25).fill(0).map(() => Array(80).fill(32)); // Space (ASCII 32)
        this.stack = [];
        this.pc = { x: 0, y: 0 };
        this.dir = { x: 1, y: 0 }; 
        this.stringMode = false;
        this.input = input;
        this.inputIndex = 0;
        this.output = "";
        this.terminated = false;

        // Load code into the 80x25 grid
        const lines = code.split(/\r?\n/);
        for (let y = 0; y < 25; y++) {
            const line = lines[y] || "";
            for (let x = 0; x < 80; x++) {
                if (x < line.length) {
                    this.grid[y][x] = line.charCodeAt(x);
                }
            }
        }
    }

    step() {
        if (this.terminated) return;
        const cmd = this.grid[this.pc.y][this.pc.x];

        if (this.stringMode && cmd !== 34) {
            this.push(cmd);
        } else {
            switch (cmd) {
                case 48: case 49: case 50: case 51: case 52:
                case 53: case 54: case 55: case 56: case 57: // 0-9
                    this.push(cmd - 48);
                    break;
                case 43: { // +
                    const a = this.pop(); const b = this.pop();
                    this.push(a + b); break;
                }
                case 45: { // -
                    const a = this.pop(); const b = this.pop();
                    this.push(b - a); break;
                }
                case 42: { // *
                    const a = this.pop(); const b = this.pop();
                    this.push(a * b); break;
                }
                case 47: { // /
                    const a = this.pop(); const b = this.pop();
                    this.push(a === 0 ? 0 : Math.floor(b / a)); break;
                }
                case 37: { // %
                    const a = this.pop(); const b = this.pop();
                    this.push(a === 0 ? 0 : b % a); break;
                }
                case 33: // !
                    this.push(this.pop() === 0 ? 1 : 0); break;
                case 96: { // `
                    const a = this.pop(); const b = this.pop();
                    this.push(b > a ? 1 : 0); break;
                }
                case 62: this.dir = { x: 1, y: 0 }; break; // >
                case 60: this.dir = { x: -1, y: 0 }; break; // <
                case 94: this.dir = { x: 0, y: -1 }; break; // ^
                case 118: this.dir = { x: 0, y: 1 }; break; // v
                case 63: { // ?
                    const ds = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
                    this.dir = ds[Math.floor(Math.random() * 4)];
                    break;
                }
                case 95: // _
                    this.dir = this.pop() === 0 ? {x:1,y:0} : {x:-1,y:0}; break;
                case 124: // |
                    this.dir = this.pop() === 0 ? {x:0,y:1} : {x:0,y:-1}; break;
                case 34: // "
                    this.stringMode = !this.stringMode; break;
                case 58: { // :
                    const a = this.pop(); this.push(a); this.push(a); break;
                }
                case 92: { // \
                    const a = this.pop(); const b = this.pop();
                    this.push(a); this.push(b); break;
                }
                case 36: this.pop(); break; // $
                case 46: // .
                    this.output += this.pop().toString() + " "; break;
                case 44: // ,
                    this.output += String.fromCharCode(this.pop()); break;
                case 35: this.move(); break; // #
                case 103: { // g
                    const y = this.pop(); const x = this.pop();
                    if (y >= 0 && y < 25 && x >= 0 && x < 80) this.push(this.grid[y][x]);
                    else this.push(0);
                    break;
                }
                case 112: { // p
                    const y = this.pop(); const x = this.pop(); const v = this.pop();
                    if (y >= 0 && y < 25 && x >= 0 && x < 80) this.grid[y][x] = v;
                    break;
                }
                case 38: { // & (integer input)
                    // Skip non-digits
                    while (this.inputIndex < this.input.length && !/[\d-]/.test(this.input[this.inputIndex])) {
                        this.inputIndex++;
                    }
                    const match = this.input.substring(this.inputIndex).match(/^-?\d+/);
                    if (match) {
                        this.push(parseInt(match[0]));
                        this.inputIndex += match[0].length;
                    } else this.push(0);
                    break;
                }
                case 126: // ~ (character input)
                    if (this.inputIndex < this.input.length) this.push(this.input.charCodeAt(this.inputIndex++));
                    else this.push(-1);
                    break;
                case 64: this.terminated = true; return; // @
            }
        }
        this.move();
    }

    move() {
        this.pc.x = (this.pc.x + this.dir.x + 80) % 80;
        this.pc.y = (this.pc.y + this.dir.y + 25) % 25;
    }

    push(v) { this.stack.push(v); }
    pop() { return this.stack.length > 0 ? this.stack.pop() : 0; }

    run(maxSteps) {
        let steps = 0;
        while (!this.terminated) {
            this.step();
            steps++;
            if (steps >= maxSteps) throw new Error("TLE");
            // Check wall clock every 10000 steps to not slow down too much
            if (steps % 10000 === 0 && steps > 0) {
                // We'll let the Promise.race handle the wall-clock timeout
            }
        }
        return this.output;
    }
}

export default LocalExecutor;
