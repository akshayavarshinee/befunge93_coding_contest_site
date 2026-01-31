import { motion } from 'framer-motion';
import { 
  Code, 
  Terminal, 
  ArrowRight, 
  Lightbulb, 
  Cpu, 
  Navigation, 
  Split, 
  Calculator, 
  Layers, 
  Hash,
  Table,
  AlertTriangle
} from 'lucide-react';

const InstructionRow = ({ cmd, desc }: { cmd: string, desc: string }) => (
  <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 group">
    <code className="px-2.5 py-1 bg-primary/20 text-primary rounded font-mono text-base min-w-[3rem] text-center shadow-[0_0_15px_-3px_rgba(var(--primary-rgb),0.3)]">
      {cmd}
    </code>
    <span className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">{desc}</span>
  </div>
);

const ExampleCard = ({ title, code, description, dryRun }: { title: string, code: string, description: string | React.ReactNode, dryRun?: React.ReactNode }) => (
  <div className="glass-card rounded-xl border border-white/10 overflow-hidden mb-6 bg-gradient-to-br from-white/5 to-transparent">
    <div className="px-5 py-4 bg-white/5 border-b border-white/10">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <Terminal className="w-4 h-4 text-primary" />
        {title}
      </h3>
      <div className="text-sm text-muted-foreground mt-1">{description}</div>
    </div>
    <div className="p-5 overflow-x-auto bg-black/40">
      <pre className="font-mono text-sm text-terminal-green leading-relaxed">
        {code}
      </pre>
    </div>
    {dryRun && (
      <div className="p-5 border-t border-white/5 bg-black/20 text-sm">
        {dryRun}
      </div>
    )}
  </div>
);

const BefungeResourcesContent = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-20"
    >
      {/* Introduction */}
      <motion.section variants={itemVariants} className="space-y-4">
        <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.4)]">
            <Lightbulb className="w-6 h-6 text-primary" />
          </div>
          INTRODUCTION
        </h2>
        <div className="glass-card p-6 rounded-2xl border-white/10 leading-relaxed text-muted-foreground space-y-4">
          <p>
            Befunge93 is a programming language where code is written on a grid, not in straight lines. 
            The program moves through this grid and reads instructions as it travels. It can go right, 
            left, up, or down, so the path of execution is part of your program logic.
          </p>
          <p>
            Think of it like a tiny robot walking over a grid of characters. Each character tells the 
            robot what to do next.
          </p>
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-foreground font-semibold mb-1">The Playfield</p>
            Your code lives inside an <span className="text-primary font-mono">80 × 25</span> box, and every cell contains one character 
            that usually acts as an instruction. <span className="text-destructive font-bold">Writing outside this box will cause errors.</span>
          </div>
          <p>
            Befunge93 mainly works using a stack. You push values onto it and pop values from it to 
            do calculations, print output, and control flow.
          </p>
          <p>
            They can also read and write the contents of any cell in the playfield, given its coordinates, 
            thus Befunge93 code can be self-modifying. Characters are represented by their ASCII values 
            within the stack, enabling operations like A + D, as they operate on the ASCII values of the characters.
          </p>
        </div>
      </motion.section>

      {/* Basic Syntax */}
      <motion.section variants={itemVariants} className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.4)]">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          BASIC SYNTAX
        </h2>
        <p className="text-muted-foreground ml-2">
          Befunge93 works using a stack. Almost every instruction either puts something on the stack or takes something from it.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-card p-6 rounded-2xl border-white/10 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
              <Calculator className="w-4 h-4" /> Numbers & Input
            </h3>
            <div className="space-y-2">
              <InstructionRow cmd="0 to 9" desc="Push that number onto the stack. So 5 means &quot;put 5 on the stack&quot;." />
              <InstructionRow cmd="&" desc="Takes an integer from the user and pushes it onto the stack." />
              <InstructionRow cmd="~" desc="Takes a single character from the user and pushes its ASCII value onto the stack." />
            </div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl border-white/10 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
              <Layers className="w-4 h-4" /> Stack & Terminate
            </h3>
            <div className="space-y-2">
              <InstructionRow cmd=":" desc="Duplicate the top value of the stack. If stack is empty, it treats the value as 0 and pushes two 0s." />
              <InstructionRow cmd="\" desc="Swap the top two values of the stack. If there is only one value, it assumes the second value is 0." />
              <InstructionRow cmd="$" desc="Pop and discard the top value of the stack." />
              <InstructionRow cmd="@" desc="Stops the program." />
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl border-white/10 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
              <Terminal className="w-4 h-4" /> String Mode & Output
            </h3>
            <div className="space-y-2">
              <InstructionRow cmd="&quot;&quot;" desc="Turns string mode ON or OFF. While string mode is ON, every character you type is pushed onto the stack as its ASCII value until another &quot; is found. This is mainly used to print text like &quot;Hello&quot;." />
              <InstructionRow cmd="." desc="Pops the top value and prints it as a number." />
              <InstructionRow cmd="," desc="Pops the top value and prints it as a character." />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Direction Pointers */}
      <motion.section variants={itemVariants} className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.4)]">
            <Navigation className="w-6 h-6 text-primary" />
          </div>
          DIRECTION POINTERS
        </h2>
        <div className="glass-card p-6 rounded-2xl border-white/10 space-y-4">
          <p className="text-muted-foreground">
            In Befunge93, the program doesn't just go left to right. The instruction pointer (think of it as a moving cursor) can change direction. Wherever it moves, it reads and executes the character in that cell.
          </p>
          <p className="text-sm font-semibold text-primary/80">By default, the program starts at the top-left corner and moves to the right.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <InstructionRow cmd=">" desc="Move right" />
            <InstructionRow cmd="<" desc="Move left" />
            <InstructionRow cmd="^" desc="Move up" />
            <InstructionRow cmd="v" desc="Move down" />
            <InstructionRow cmd="?" desc="Move in a random direction (up, down, left, or right)." />
            <InstructionRow cmd="#" desc="Skip the next cell in the current direction." />
          </div>
          <div className="mt-4 p-4 bg-secondary/20 rounded-xl space-y-2 border border-white/5">
            <p className="text-sm text-foreground italic">
              "If your code hits v, the program will start moving downward from that point. You are not just writing instructions, you are drawing paths for the program to follow."
            </p>
            <div className="flex gap-4 items-center">
              <span className="text-xs text-muted-foreground">Infinite loop example:</span>
              <pre className="text-primary font-mono bg-black/40 px-3 py-2 rounded-lg border border-primary/20 text-xs">
                {`>v\n^<`}
              </pre>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Conditional Statements */}
      <motion.section variants={itemVariants} className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.4)]">
            <Split className="w-6 h-6 text-primary" />
          </div>
          CONDITIONAL STATEMENTS
        </h2>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <InstructionRow cmd="_" desc="Horizontal IF: pop a value; set direction to right if value=0, set to left otherwise" />
            <InstructionRow cmd="|" desc="Vertical IF: pop a value; set direction to down if value=0, set to up otherwise" />
          </div>
          
          <div className="glass-card p-6 rounded-2xl border-primary/20 bg-primary/5">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-3">
              <Hash className="w-5 h-5" /> Trick 1: Using # before a condition
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              # skips the next cell. You can use this to jump directly to a condition operator.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2">Examples</span>
                <div className="flex gap-4">
                  <pre className="font-mono text-xs bg-black/50 p-3 rounded-lg border border-white/10 text-terminal-green w-fit">
                    {`#v_`}
                  </pre>
                  <pre className="font-mono text-xs bg-black/50 p-3 rounded-lg border border-white/10 text-terminal-green w-fit">
                    {`#^_`}
                  </pre>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">How it works:</span>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li>The instruction pointer reaches #</li>
                  <li>It skips the arrow (v or ^)</li>
                  <li>It lands on _</li>
                  <li>_ checks the value and changes direction</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-foreground">
              This makes conditional logic shorter and cleaner. You don't need long paths just to reach _ or |. # helps you "jump" straight to the condition.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Mathematical Operations */}
      <motion.section variants={itemVariants} className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.4)]">
            <Calculator className="w-6 h-6 text-primary" />
          </div>
          MATHEMATICAL OPERATIONS
        </h2>
        <div className="glass-card p-6 rounded-2xl border-white/10">
          <p className="text-muted-foreground mb-6 leading-relaxed">
            All math in Befunge93 works using the stack. It takes numbers from the stack, does the operation, and pushes the result back.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            <InstructionRow cmd="+" desc="Addition: Pops b, then pops a, followed by pushing a + b" />
            <InstructionRow cmd="-" desc="Subtraction: Pops b, then pops a, followed by pushing a - b" />
            <InstructionRow cmd="*" desc="Multiplication: Pops b, then pops a, followed by pushing a * b" />
            <InstructionRow cmd="/" desc="Division: Pops b, then pops a, followed by pushing a/b (rounded down). b cannot be zero." />
            <InstructionRow cmd="%" desc="Modulus: Pops b, then pops a, followed by pushing a % b" />
            <InstructionRow cmd="!" desc="Logical NOT: Pop a value. If zero, push 1; otherwise, push 0." />
            <InstructionRow cmd="`" desc="Greater Than: Pops b, then pops a, then push 1 if a > b, otherwise 0." />
          </div>
          <div className="mt-8 p-5 bg-destructive/10 border border-destructive/20 rounded-xl">
             <h4 className="text-destructive font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Important stack order rule
             </h4>
             <p className="text-sm text-foreground/80 leading-relaxed uppercase font-black">
                The first popped value (b) is the second operand.
             </p>
             <p className="text-sm text-muted-foreground mt-1">
                So, for subtraction and division it's always <span className="font-mono text-primary">a - b</span> and <span className="font-mono text-primary">a / b</span>, not <span className="font-mono text-destructive">b - a</span>.
             </p>
          </div>
        </div>
      </motion.section>

      {/* Special Instructions */}
      <motion.section variants={itemVariants} className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.4)]">
            <Code className="w-6 h-6 text-primary" />
          </div>
          SPECIAL INSTRUCTIONS
        </h2>
        <div className="glass-card p-6 rounded-2xl border-white/10 space-y-6">
          <p className="text-muted-foreground">
            Apart from the above instructions, there exist 2 special instructions in Befunge93; get(g) and put(p). These two are very powerful and must be used carefully. These are generally used to store data on the 2D playfield itself so that it becomes easier to access this data.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-mono text-primary font-bold flex items-center gap-2">
                g <ArrowRight className="w-3 h-3 text-muted-foreground" /> get from the grid
              </h4>
              <ul className="text-sm space-y-1.5 text-muted-foreground list-disc list-inside">
                <li>Pops y, then x from the stack</li>
                <li>Looks at position (x, y) in the program grid</li>
                <li>Pushes the ASCII value stored there onto the stack</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-mono text-primary font-bold flex items-center gap-2">
                p <ArrowRight className="w-3 h-3 text-muted-foreground" /> put into the grid
              </h4>
              <ul className="text-sm space-y-1.5 text-muted-foreground list-disc list-inside">
                <li>Pops y, then x, then v</li>
                <li>Writes the value v into position (x, y) of the grid</li>
              </ul>
            </div>
          </div>
          
          <div className="p-6 bg-primary/10 rounded-2xl border border-primary/20 space-y-3">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <Hash className="w-5 h-5" /> Trick 2: Using unused cells as memory (p and g)
            </h3>
            <p className="text-sm text-muted-foreground">
              Pick some cells that your code will never go through. Use them to store values.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm italic font-medium flex items-center gap-3">
                <span className="font-mono text-primary bg-black/40 px-3 py-1.5 rounded-lg border border-primary/30">p</span>
                <span>store a value in a cell</span>
              </div>
              <div className="text-sm italic font-medium flex items-center gap-3">
                <span className="font-mono text-primary bg-black/40 px-3 py-1.5 rounded-lg border border-primary/30">g</span>
                <span>read the value from that cell</span>
              </div>
            </div>
            <p className="text-sm font-semibold pt-2 border-t border-primary/10">
              This works like variables in other languages. It helps you save results and reuse values instead of keeping everything on the stack.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Code Examples */}
      <motion.section variants={itemVariants} className="space-y-8">
        <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.4)]">
            <Terminal className="w-6 h-6 text-primary" />
          </div>
          CODE EXAMPLES
        </h2>
        
        <div className="space-y-2">
          <ExampleCard 
            title="1. Printing a number"
            code="23+.@"
            description="Push 2, push 3, add them → stack has 5 → . prints 5 → @ ends."
          />
          
          <ExampleCard 
            title="2. Printing a character"
            code="65,@"
            description={<>65 is ASCII for A.<br/>, prints the character → output is A.</>}
          />
          
          <ExampleCard 
            title="3. Printing a String"
            code={`"!iH",,,@`}
            description={
              <ul className="space-y-1 list-disc list-inside opacity-80">
                <li>&quot; starts string mode</li>
                <li>H and I go into the stack</li>
                <li>&quot; ends string mode</li>
                <li>, prints I</li>
                <li>, prints H</li>
                <li>(Stack is LIFO, so order matters)</li>
              </ul>
            }
          />
          
          <ExampleCard 
            title="4. Using conditionals"
            code="0_@"
            description="Push 0 → _ sees 0 → goes right → hits @ → program ends. Change 0 to any non-zero number and it will go left instead."
          />
          
          <ExampleCard 
            title="5. Using get and put commands"
            code={`" A" 01p 01g, @`}
            description={
              <ul className="space-y-1 list-disc list-inside opacity-80">
                <li>&quot; A&quot; pushes ASCII of space and A</li>
                <li>01p stores A at grid position (0,1)</li>
                <li>01g reads it back</li>
                <li>, prints it → outputs A</li>
              </ul>
            }
          />

          <ExampleCard 
            title="6. Uppercase checker (Medium)"
            code="~:88*` \ 52*9*1+` ! * . @"
            description="Checks if an input character is between 'A' (65) and 'Z' (90)."
            dryRun={
              <div className="grid gap-2 font-mono text-xs">
                 <div className="p-2 bg-black/40 rounded border border-white/5 flex gap-4">
                  <span className="text-primary min-w-[30px]">~</span> 
                  <span className="text-muted-foreground">Inputs a character</span>
                 </div>
                 <div className="p-2 bg-black/40 rounded border border-white/5 flex gap-4">
                  <span className="text-primary min-w-[30px]">:</span> 
                  <span className="text-muted-foreground">Duplicates the top value on stack</span>
                 </div>
                 <div className="p-2 bg-black/40 rounded border border-white/5 flex gap-4">
                  <span className="text-primary min-w-[30px]">88*</span> 
                  <span className="text-muted-foreground">Pushes 8, 8, computes product (64)</span>
                 </div>
                 <div className="p-2 bg-black/40 rounded border border-white/5 flex gap-4">
                  <span className="text-primary min-w-[30px]">`</span> 
                  <span className="text-muted-foreground">Checks if input {'>'} 64 (ASCII of @)</span>
                 </div>
                 <div className="p-2 bg-black/40 rounded border border-white/5 flex gap-4">
                  <span className="text-primary min-w-[30px]">\</span> 
                  <span className="text-muted-foreground">Swaps values to check upper bound</span>
                 </div>
                 <div className="p-2 bg-black/40 rounded border border-white/5 flex gap-4">
                  <span className="text-primary min-w-[30px]">52*9*1+</span> 
                  <span className="text-muted-foreground">Computes 91 (5*2*9 + 1)</span>
                 </div>
                 <div className="p-2 bg-black/40 rounded border border-white/5 flex gap-4">
                  <span className="text-primary min-w-[30px]">`</span> 
                  <span className="text-muted-foreground">Checks if input {'>'} 91 (ASCII of [)</span>
                 </div>
                 <div className="p-2 bg-black/40 rounded border border-white/5 flex gap-4">
                  <span className="text-primary min-w-[30px]">!</span> 
                  <span className="text-muted-foreground">NOT result of upper bound check</span>
                 </div>
                 <div className="p-2 bg-black/40 rounded border border-white/5 flex gap-4">
                  <span className="text-primary min-w-[30px]">*</span> 
                  <span className="text-muted-foreground">ANDs the two checks</span>
                 </div>
                 <div className="p-2 bg-black/40 rounded border border-white/5 flex gap-4">
                  <span className="text-primary min-w-[30px]">.@</span> 
                  <span className="text-muted-foreground">Prints result (1/0) and ends</span>
                 </div>
              </div>
            }
          />

          <ExampleCard 
            title="7. Power Function (Hard)"
            code={`109p > &19p > &:29p > 0\` #v_ 1. @\n      >       > 29g: 0\` #v_ 09g. @\n      ^ p90 * < g90 < g91 < p92 < -1 <`}
            description="Reads base and exponent, outputs base^exponent."
            dryRun={
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10px]">
                 <div className="p-2 bg-black/20 rounded border border-white/5"><span className="text-primary">109p</span>: Stores 1 in (0,9) (result)</div>
                 <div className="p-2 bg-black/20 rounded border border-white/5"><span className="text-primary">&19p</span>: Reads base, stores in (1,9)</div>
                 <div className="p-2 bg-black/20 rounded border border-white/5"><span className="text-primary">&:29p</span>: Reads exponent, stores in (2,9)</div>
                 <div className="p-2 bg-black/20 rounded border border-white/5"><span className="text-primary">0\`#_1.@</span>: If exp == 0, print 1</div>
                 <div className="p-2 bg-black/20 rounded border border-white/5"><span className="text-primary">29g:0\`#v_09g.@</span>: Loop until exp == 0</div>
                 <div className="p-2 bg-black/20 rounded border border-white/5"><span className="text-primary">*09p</span>: result *= base</div>
              </div>
            }
          />
        </div>
      </motion.section>

      {/* ASCII Table */}
      <motion.section variants={itemVariants} className="space-y-6">
        <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.4)]">
            <Table className="w-6 h-6 text-primary" />
          </div>
          ASCII TABLE
        </h2>
        <div className="glass-card rounded-2xl border-white/10 overflow-hidden bg-black/20">
          <div className="flex flex-wrap text-xs md:text-[11px] font-mono">
            {Array.from({ length: 128 }).map((_, i) => {
              const ascii = i;
              let char = '';
              if (ascii === 32) char = '[space]';
              else if (ascii < 32) char = ''; // Control characters
              else if (ascii === 127) char = '';
              else char = String.fromCharCode(ascii);
              
              return (
                <div key={ascii} className="w-1/3 sm:w-1/4 md:w-[12.5%] p-2.5 border border-white/5 flex justify-between gap-1 hover:bg-primary/10 transition-colors">
                  <span className="text-muted-foreground">{ascii}</span>
                  <span className="text-primary font-bold truncate">{char}</span>
                </div>
              );
            })}
          </div>
          <div className="p-3 bg-white/5 text-[11px] text-muted-foreground text-center">
            Complete ASCII Reference (0-127)
          </div>
        </div>
      </motion.section>

    </motion.div>
  );
};

export default BefungeResourcesContent;


