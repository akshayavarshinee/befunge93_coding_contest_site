import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Terminal, Zap, Trophy, Code, ArrowRight, Sparkles } from 'lucide-react';

const Landing = () => {
  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">TALOS 2026</span>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-7xl font-bold mb-6"
            >
              <span className="text-foreground">Befunge 93</span>
              <br />
              <span className="text-primary text-glow">Battle Arena</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto"
            >
              Master the art of two-dimensional programming
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto"
            >
              Compete in the ultimate esoteric language challenge. Write code that flows in every direction.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/auth/register">
                <Button variant="glow" size="xl" className="gap-2">
                  Start Competing
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/resources">
                <Button variant="outline" size="xl" className="gap-2">
                  Learn Befunge-93
                  <Code className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Decorative Terminal */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-16 max-w-2xl mx-auto"
            >
              <div className="glass-card rounded-xl overflow-hidden border border-border/30">
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary/30 border-b border-border/30">
                  <img src="../../favicon.ico" alt="Terminal" className="w-4 h-4" />
                  <span className="text-xs text-muted-foreground font-mono ml-2">befunge-93</span>
                </div>
                <div className="p-6 font-mono text-sm text-left">
                  <pre className="text-terminal-green leading-relaxed">
{`>              v
v  ,,,,,"Hello"<
>48teleWorld",!
        ^     <`}
                  </pre>
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <span className="text-muted-foreground">Output: </span>
                    <span className="text-primary">Hello World!</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 border-t border-border/30">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: Terminal,
                  title: 'Esoteric Excellence',
                  description: 'Challenge yourself with Befunge-93, where code execution travels in 2D space.',
                },
                {
                  icon: Zap,
                  title: 'Real-time Judging',
                  description: 'Instant feedback on your submissions with our optimized execution engine.',
                },
                {
                  icon: Trophy,
                  title: 'Compete & Rank',
                  description: 'Climb the leaderboard, earn recognition, and prove your skills.',
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-xl p-6 border border-border/30 hover-glow"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border/30">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">TALOS Stranger Codes</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2026 TALOS Symposium. Built for the curious minds.
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default Landing;
