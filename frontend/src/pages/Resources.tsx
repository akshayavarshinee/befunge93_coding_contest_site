import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { BookOpen } from 'lucide-react';
import BefungeResourcesContent from '@/components/BefungeResourcesContent';

const Resources = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 mb-6 shadow-[0_0_30px_-5px_rgba(var(--primary-rgb),0.5)]">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">
            BEFUNGE-93 <span className="text-primary">RESOURCES</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The official syntax sheet and documentation for the Stranger Codes contest.
          </p>
        </motion.div>

        <BefungeResourcesContent />
      </div>
    </Layout>
  );
};

export default Resources;

