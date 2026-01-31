import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import ContestCard from '@/components/contest/ContestCard';
import { Contest, contestApi } from '@/lib/api';
import { Trophy, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Contests = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [filter, setFilter] = useState<'all' | 'running' | 'paused' | 'upcoming' | 'ended'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      setIsLoading(true);
      try {
        const data = await contestApi.getAll();
        setContests(data);
      } catch (error) {
        console.error("Failed to fetch contests", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContests();
  }, []);

  const getContestStatus = (contest: Contest) => {
    const now = new Date();
    if (contest.is_paused) return 'paused';
    if (!contest.start_time) return 'upcoming';
    const startTime = new Date(contest.start_time);
    const endTime = contest.end_time ? new Date(contest.end_time) : null;
    if (now < startTime) return 'upcoming';
    if (endTime && now > endTime) return 'ended';
    return 'running';
  };

  const filteredContests = contests
    .filter((contest) => {
      if (filter === 'all') return true;
      return getContestStatus(contest) === filter;
    })
    .filter((contest) =>
      contest.name.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Contests</h1>
          <p className="text-lg text-muted-foreground">
            Join a live contest or explore past challenges
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-8"
        >
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {(['all', 'running', 'paused', 'upcoming', 'ended'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Contest Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-6 border border-border/30 animate-pulse"
              >
                <div className="h-6 bg-secondary rounded w-3/4 mb-4" />
                <div className="h-4 bg-secondary rounded w-1/2 mb-6" />
                <div className="h-10 bg-secondary rounded" />
              </div>
            ))}
          </div>
        ) : filteredContests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No contests found</h3>
            <p className="text-muted-foreground">
              {search ? 'Try a different search term' : 'Check back soon for new challenges'}
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContests.map((contest, index) => (
              <ContestCard key={contest.id} contest={contest} index={index} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Contests;
