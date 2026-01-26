import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, FastForward, Layers, Terminal } from 'lucide-react';

interface BefungeRunnerProps {
  code: string;
}

interface ExecutionState {
  grid: string[][];
  x: number;
  y: number;
  dx: number;
  dy: number;
  stack: number[];
  output: string;
  stringMode: boolean;
  halted: boolean;
  inputBuffer: string;
  inputIndex: number;
}

const GRID_WIDTH = 80;
const GRID_HEIGHT = 25;

const BefungeRunner = ({ code }: BefungeRunnerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(100); // milliseconds per step
  const [customInput, setCustomInput] = useState('');
  const [state, setState] = useState<ExecutionState>(() => initializeState(code, ''));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  function initializeState(sourceCode: string, input: string): ExecutionState {
    const grid: string[][] = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(' '));
    const lines = sourceCode.split('\n');
    for (let y = 0; y < Math.min(lines.length, GRID_HEIGHT); y++) {
      for (let x = 0; x < Math.min(lines[y].length, GRID_WIDTH); x++) {
        grid[y][x] = lines[y][x];
      }
    }
    return {
      grid,
      x: 0,
      y: 0,
      dx: 1,
      dy: 0,
      stack: [],
      output: '',
      stringMode: false,
      halted: false,
      inputBuffer: input,
      inputIndex: 0,
    };
  }

  const step = useCallback((): boolean => {
    const s = { ...stateRef.current };
    if (s.halted) return false;

    const char = s.grid[s.y][s.x];
    
    if (s.stringMode && char !== '"') {
      s.stack.push(char.charCodeAt(0));
    } else {
      switch (char) {
        case '>': s.dx = 1; s.dy = 0; break;
        case '<': s.dx = -1; s.dy = 0; break;
        case '^': s.dx = 0; s.dy = -1; break;
        case 'v': s.dx = 0; s.dy = 1; break;
        case '?':
          const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
          const [ndx, ndy] = dirs[Math.floor(Math.random() * 4)];
          s.dx = ndx; s.dy = ndy;
          break;
        case '+': {
          const b = s.stack.pop() || 0;
          const a = s.stack.pop() || 0;
          s.stack.push(a + b);
          break;
        }
        case '-': {
          const b = s.stack.pop() || 0;
          const a = s.stack.pop() || 0;
          s.stack.push(a - b);
          break;
        }
        case '*': {
          const b = s.stack.pop() || 0;
          const a = s.stack.pop() || 0;
          s.stack.push(a * b);
          break;
        }
        case '/': {
          const b = s.stack.pop() || 0;
          const a = s.stack.pop() || 0;
          s.stack.push(b === 0 ? 0 : Math.floor(a / b));
          break;
        }
        case '%': {
          const b = s.stack.pop() || 0;
          const a = s.stack.pop() || 0;
          s.stack.push(b === 0 ? 0 : a % b);
          break;
        }
        case '!':
          s.stack.push(s.stack.pop() === 0 ? 1 : 0);
          break;
        case '`': {
          const b = s.stack.pop() || 0;
          const a = s.stack.pop() || 0;
          s.stack.push(a > b ? 1 : 0);
          break;
        }
        case '_':
          s.dx = s.stack.pop() === 0 ? 1 : -1;
          s.dy = 0;
          break;
        case '|':
          s.dy = s.stack.pop() === 0 ? 1 : -1;
          s.dx = 0;
          break;
        case '"':
          s.stringMode = !s.stringMode;
          break;
        case ':': {
          const val = s.stack.pop() || 0;
          s.stack.push(val, val);
          break;
        }
        case '\\': {
          const a = s.stack.pop() || 0;
          const b = s.stack.pop() || 0;
          s.stack.push(a, b);
          break;
        }
        case '$':
          s.stack.pop();
          break;
        case '.':
          s.output += (s.stack.pop() || 0).toString() + ' ';
          break;
        case ',':
          s.output += String.fromCharCode(s.stack.pop() || 0);
          break;
        case '#':
          s.x = (s.x + s.dx + GRID_WIDTH) % GRID_WIDTH;
          s.y = (s.y + s.dy + GRID_HEIGHT) % GRID_HEIGHT;
          break;
        case 'g': {
          const py = s.stack.pop() || 0;
          const px = s.stack.pop() || 0;
          if (py >= 0 && py < GRID_HEIGHT && px >= 0 && px < GRID_WIDTH) {
            s.stack.push(s.grid[py][px].charCodeAt(0));
          } else {
            s.stack.push(0);
          }
          break;
        }
        case 'p': {
          const py = s.stack.pop() || 0;
          const px = s.stack.pop() || 0;
          const pv = s.stack.pop() || 0;
          if (py >= 0 && py < GRID_HEIGHT && px >= 0 && px < GRID_WIDTH) {
            s.grid[py][px] = String.fromCharCode(pv);
          }
          break;
        }
        case '&': {
          // Read integer from input
          let num = '';
          while (s.inputIndex < s.inputBuffer.length && /\d/.test(s.inputBuffer[s.inputIndex])) {
            num += s.inputBuffer[s.inputIndex++];
          }
          if (s.inputBuffer[s.inputIndex] === ' ' || s.inputBuffer[s.inputIndex] === '\n') {
            s.inputIndex++;
          }
          s.stack.push(num ? parseInt(num, 10) : 0);
          break;
        }
        case '~': {
          // Read character from input
          if (s.inputIndex < s.inputBuffer.length) {
            s.stack.push(s.inputBuffer.charCodeAt(s.inputIndex++));
          } else {
            s.stack.push(-1);
          }
          break;
        }
        case '@':
          s.halted = true;
          break;
        default:
          if (char >= '0' && char <= '9') {
            s.stack.push(parseInt(char, 10));
          }
      }
    }

    // Move pointer
    if (!s.halted) {
      s.x = (s.x + s.dx + GRID_WIDTH) % GRID_WIDTH;
      s.y = (s.y + s.dy + GRID_HEIGHT) % GRID_HEIGHT;
    }

    setState(s);
    stateRef.current = s;
    return !s.halted;
  }, []);

  const handleRun = useCallback(() => {
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);
    } else {
      if (state.halted) {
        setState(initializeState(code, customInput));
      }
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        const continuing = step();
        if (!continuing) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
        }
      }, speed);
    }
  }, [isRunning, state.halted, code, customInput, speed, step]);

  const handleReset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setState(initializeState(code, customInput));
  }, [code, customInput]);

  const handleStep = useCallback(() => {
    if (state.halted) {
      setState(initializeState(code, customInput));
    }
    step();
  }, [state.halted, code, customInput, step]);

  // Update interval when speed changes
  useEffect(() => {
    if (isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        const continuing = step();
        if (!continuing) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsRunning(false);
        }
      }, speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [speed, isRunning, step]);


  return (
    <div className="flex h-full w-full bg-[#0d0d0d] text-foreground font-sans">
      
      {/* LEFT: Code Editor / Grid Visualization */}
      <div className="flex-1 flex flex-col border-r border-border/20 overflow-hidden relative">
        {/* Toolbar Over Grid (Optional or remove) - keeping clean */}
        <div className="flex-1 overflow-auto p-4">
            {/* The Grid */}
            <div className="font-mono text-[14px] leading-[20px] inline-block tracking-normal select-none relative">
                 {/* Optional: Add line numbers column here if needed, but grid is simple */}
                 
                {state.grid.slice(0, 25).map((row, y) => (
                    <div key={y} className="flex">
                    {/* Line Number */}
                    <span className="w-8 text-muted-foreground/30 text-right pr-3 select-none text-xs leading-[20px]">{y + 1}</span>
                    
                    {row.slice(0, 80).map((cell, x) => {
                        const isPointer = x === state.x && y === state.y;
                        return (
                        <span
                            key={x}
                            className={`w-3 h-[20px] inline-flex items-center justify-center transition-colors duration-75 ${
                            isPointer
                                ? 'bg-primary text-primary-foreground font-bold z-10'
                                : cell !== ' '
                                ? 'text-[#d4d4d4]' // Monaco default text color ish
                                : 'text-muted-foreground/10'
                            }`}
                        >
                            {cell}
                        </span>
                        );
                    })}
                    </div>
                ))}
            </div>
        </div>
        
        {/* Status Overlay */}
        <div className="px-4 py-2 border-t border-border/10 bg-card/10 backdrop-blur text-xs flex justify-between items-center">
            <div className="flex gap-4">
                <span>Pos: <span className="font-mono text-primary">{state.x}, {state.y}</span></span>
                <span>Dir: <span className="font-mono text-primary" >
                    {state.dx === 1 ? '➡' : state.dx === -1 ? '⬅' : state.dy === 1 ? '⬇' : '⬆'}
                </span></span>
            </div>
            <div>
                 {state.halted ? <span className="text-red-400 font-bold">HALTED</span> : state.stringMode ? <span className="text-yellow-400">STRING MODE</span> : <span className="text-green-500">RUNNING</span>}
            </div>
        </div>
      </div>

      {/* RIGHT: Stack & Controls & IO */}
      <div className="w-[350px] flex flex-col shrink-0 bg-[#0a0a0a]">
        
        {/* 1. Stack Visualization */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 border-b border-border/20">
            <div className="px-4 py-3 border-b border-border/10 flex items-center justify-between bg-card/5">
                <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Layers className="w-4 h-4" /> Stack 
                    <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-xs font-mono">{state.stack.length}</span>
                </h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden space-y-1">
                {state.stack.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground/30 text-sm italic">
                        Empty Stack
                    </div>
                ) : (
                    // Display stack from top (end of array) to bottom
                    [...state.stack].reverse().map((val, i) => (
                        <motion.div 
                            key={`${state.stack.length - i}-${val}`}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-secondary/30 border border-secondary/50 rounded flex items-center px-3 py-2 font-mono text-sm group"
                        >
                            <span className="text-muted-foreground/50 text-xs w-6 mr-2">
                                {state.stack.length - 1 - i}:
                            </span>
                            <span className="text-foreground font-bold">
                                {val}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                0x{val.toString(16).toUpperCase()}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                '{String.fromCharCode(val > 32 && val < 127 ? val : 32)}'
                            </span>
                        </motion.div>
                    ))
                )}
            </div>
        </div>

        {/* 2. Output & Input */}
        <div className="h-[200px] flex flex-col border-b border-border/20">
             <div className="flex-1 flex flex-col min-h-0 border-b border-border/10">
                 <div className="px-3 py-1.5 bg-card/5 text-xs text-muted-foreground font-medium flex items-center gap-2">
                    <Terminal className="w-3 h-3" /> Output
                 </div>
                 <div className="flex-1 p-2 font-mono text-sm text-terminal-green bg-black/50 overflow-auto whitespace-pre-wrap leading-tight">
                    {state.output || <span className="opacity-30">Waiting for output...</span>}
                 </div>
             </div>
             
             <div className="p-3 bg-card/5">
                 <Input 
                    value={customInput} 
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Input buffer..."
                    className="h-8 font-mono text-xs bg-background/50 border-border/30"
                 />
             </div>
        </div>

        {/* 3. Controls */}
        <div className="p-4 bg-card/10 space-y-4">
             {/* Speed Slider */}
             <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Speed</span>
                    <span className="font-mono">{speed}ms</span>
                </div>
                <Slider
                    value={[speed]}
                    onValueChange={([v]) => setSpeed(v)}
                    min={10}
                    max={1000}
                    step={10}
                    className="cursor-pointer"
                />
             </div>

             <div className="grid grid-cols-4 gap-2">
                 <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleReset}
                    className="col-span-1"
                    title="Reset"
                >
                     <RotateCcw className="w-4 h-4" />
                 </Button>
                 
                 <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleStep}
                    disabled={isRunning || state.halted}
                    className="col-span-1"
                    title="Step"
                >
                     <FastForward className="w-4 h-4 rotate-90" />
                 </Button>

                 <Button 
                    variant={isRunning ? "destructive" : "default"} 
                    size="sm" 
                    onClick={handleRun}
                    className="col-span-2"
                 >
                     {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                     {isRunning ? 'Stop' : 'Run'}
                 </Button>
             </div>
        </div>

      </div>
    </div>
  );
};

export default BefungeRunner;
