import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { BookOpen, ExternalLink, Code, ArrowRight, Lightbulb, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Resources = () => {
  const sections = [
    {
      title: 'What is Befunge-93?',
      content: `Befunge-93 is a two-dimensional esoteric programming language invented by Chris Pressey in 1993. Unlike traditional programming languages where code is read linearly, Befunge-93 programs exist on a toroidal 80×25 grid of ASCII characters. The instruction pointer can move in any of the four cardinal directions (up, down, left, right), and the direction is controlled by the program itself.`,
    },
    {
      title: 'The Playfield',
      content: `The Befunge-93 playfield is an 80×25 torus (wrapping grid). The instruction pointer starts at the top-left corner (0,0) moving right. When it reaches an edge, it wraps around to the opposite side. Each cell contains a single ASCII character that acts as both code and data.`,
    },
  ];

  const instructions = [
    { cmd: '0-9', desc: 'Push the corresponding digit onto the stack' },
    { cmd: '+', desc: 'Addition: Pop a and b, push a+b' },
    { cmd: '-', desc: 'Subtraction: Pop a and b, push b-a' },
    { cmd: '*', desc: 'Multiplication: Pop a and b, push a*b' },
    { cmd: '/', desc: 'Integer division: Pop a and b, push b/a' },
    { cmd: '%', desc: 'Modulo: Pop a and b, push b%a' },
    { cmd: '!', desc: 'Logical NOT: Pop a, push 1 if a=0, else 0' },
    { cmd: '`', desc: 'Greater than: Pop a and b, push 1 if b>a' },
    { cmd: '>', desc: 'Move right' },
    { cmd: '<', desc: 'Move left' },
    { cmd: '^', desc: 'Move up' },
    { cmd: 'v', desc: 'Move down' },
    { cmd: '?', desc: 'Move in a random direction' },
    { cmd: '_', desc: 'Horizontal if: Pop, move right if 0, left otherwise' },
    { cmd: '|', desc: 'Vertical if: Pop, move down if 0, up otherwise' },
    { cmd: '"', desc: 'Toggle string mode (push ASCII values)' },
    { cmd: ':', desc: 'Duplicate top of stack' },
    { cmd: '\\', desc: 'Swap top two stack values' },
    { cmd: '$', desc: 'Pop and discard top of stack' },
    { cmd: '.', desc: 'Pop and output as integer' },
    { cmd: ',', desc: 'Pop and output as ASCII character' },
    { cmd: '#', desc: 'Bridge: Skip next cell' },
    { cmd: 'p', desc: 'Put: Pop y, x, v; put v at (x,y)' },
    { cmd: 'g', desc: 'Get: Pop y, x; push value at (x,y)' },
    { cmd: '&', desc: 'Input integer from user' },
    { cmd: '~', desc: 'Input character from user' },
    { cmd: '@', desc: 'End program' },
    { cmd: ' ', desc: 'No-op (space)' },
  ];

  const examples = [
    {
      title: 'Hello World',
      code: `>              v
v  ,,,,,"Hello"<
>48*,          v
v,,,,,,"World!"<
>25*,@`,
      description: 'Outputs "Hello World!" using string mode and ASCII output.',
    },
    {
      title: 'Simple Counter',
      code: `0>:. 1+v
  ^    <`,
      description: 'Counts from 0 to infinity, printing each number.',
    },
    {
      title: 'Factorial',
      code: `&>:1-:v v *_$.@
 ^    _$>\\:^`,
      description: 'Reads a number and outputs its factorial.',
    },
  ];

  const externalLinks = [
    {
      title: 'Official Befunge-93 Specification',
      url: 'https://esolangs.org/wiki/Befunge',
      description: 'Complete language specification on Esolang Wiki',
    },
    {
      title: 'Online Befunge Interpreter',
      url: 'https://www.bedroomlan.org/tools/befunge-playground/',
      description: 'Try Befunge code in your browser',
    },
    {
      title: 'Befunge Tutorial',
      url: 'https://github.com/catseye/Befunge-93',
      description: 'Original implementation and examples',
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Befunge-93 Resources</h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to master two-dimensional programming
          </p>
        </motion.div>

        {/* Introduction Sections */}
        {sections.map((section, index) => (
          <motion.section
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card rounded-xl p-6 border border-border/30 mb-6"
          >
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              {section.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">{section.content}</p>
          </motion.section>
        ))}

        {/* Instruction Reference */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-6 border border-border/30 mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Instruction Reference
          </h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {instructions.map((instr) => (
              <div
                key={instr.cmd}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors"
              >
                <code className="px-2 py-1 bg-primary/10 text-primary rounded font-mono text-sm min-w-[2.5rem] text-center">
                  {instr.cmd}
                </code>
                <span className="text-sm text-muted-foreground">{instr.desc}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Code Examples */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            Code Examples
          </h2>
          <div className="grid gap-4">
            {examples.map((example) => (
              <div
                key={example.title}
                className="glass-card rounded-xl border border-border/30 overflow-hidden"
              >
                <div className="px-4 py-3 bg-secondary/30 border-b border-border/30">
                  <h3 className="font-semibold text-foreground">{example.title}</h3>
                  <p className="text-sm text-muted-foreground">{example.description}</p>
                </div>
                <pre className="p-4 font-mono text-sm text-terminal-green overflow-x-auto">
                  {example.code}
                </pre>
              </div>
            ))}
          </div>
        </motion.section>

        {/* External Links */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl p-6 border border-border/30"
        >
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            External Resources
          </h2>
          <div className="grid gap-3">
            {externalLinks.map((link) => (
              <a
                key={link.title}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </a>
            ))}
          </div>
        </motion.section>
      </div>
    </Layout>
  );
};

export default Resources;
