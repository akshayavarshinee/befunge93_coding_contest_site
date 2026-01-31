import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { LeaderboardEntry, leaderboardApi } from '@/lib/api';
import { Trophy, Medal, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';



const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Get contestId from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const contestId = searchParams.get('contestId') || '1'; // Default to contest 1

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await leaderboardApi.get(contestId);
      setEntries(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch leaderboard", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'rank-gold';
      case 2:
        return 'rank-silver';
      case 3:
        return 'rank-bronze';
      default:
        return 'text-muted-foreground';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return (
        <Medal
          className={`w-5 h-5 ${
            rank === 1
              ? 'text-yellow-400'
              : rank === 2
              ? 'text-gray-300'
              : 'text-orange-400'
          }`}
        />
      );
    }
    return <span className="w-5 text-center font-mono">{rank}</span>;
  };

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
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Leaderboard</h1>
          <p className="text-lg text-muted-foreground mb-4">
            Top performers in the Befunge Battle Arena
          </p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <Button variant="ghost" size="sm" onClick={fetchLeaderboard} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl border border-border/30 overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-secondary/30 border-b border-border/30 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-4">Team</div>
            <div className="col-span-2 text-center">Score</div>
            <div className="col-span-2 text-center">Time</div>
            <div className="col-span-2 text-center text-destructive">Violations</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border/30">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 animate-pulse">
                  <div className="col-span-2 flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-secondary" />
                  </div>
                  <div className="col-span-4">
                    <div className="h-4 bg-secondary rounded w-32" />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className="h-4 bg-secondary rounded w-8" />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className="h-4 bg-secondary rounded w-16" />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className="h-4 bg-secondary rounded w-16" />
                  </div>
                </div>
              ))
            ) : (
              entries.map((entry, index) => {
                const rank = index + 1;
                return (
                  <motion.div
                    key={entry.team_id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 transition-colors ${
                      rank <= 3 ? 'bg-primary/5' : 'hover:bg-secondary/30'
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-2 flex items-center justify-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          rank === 1
                            ? 'bg-yellow-500/20 border-2 border-yellow-500/50'
                            : rank === 2
                            ? 'bg-gray-300/20 border-2 border-gray-300/50'
                            : rank === 3
                            ? 'bg-orange-500/20 border-2 border-orange-500/50'
                            : 'bg-secondary'
                        }`}
                      >
                        {getRankIcon(rank)}
                      </div>
                    </div>

                    {/* Username */}
                    <div className="col-span-4 flex items-center">
                      <span className={`font-medium ${rank <= 3 ? getRankStyle(rank) : 'text-foreground'}`}>
                        {entry.username}
                      </span>
                    </div>

                    {/* Score */}
                    <div className="col-span-2 flex items-center justify-center">
                      <span className="font-mono font-bold text-lg text-primary">
                        {entry.total_score}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="col-span-2 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono">{formatTime(entry.total_time)}</span>
                    </div>

                    {/* Violations */}
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      {entry.violation_count && entry.violation_count > 0 ? (
                        <div className="flex items-center gap-1 text-destructive font-mono font-bold">
                            <AlertTriangle className="w-4 h-4" />
                            {entry.violation_count}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/30 font-mono">-</span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          <p>Ranking: Higher score wins • Ties broken by lower total time</p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Leaderboard;
