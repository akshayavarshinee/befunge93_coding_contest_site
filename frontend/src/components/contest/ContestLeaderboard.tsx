import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LeaderboardEntry, leaderboardApi } from '@/lib/api';
import { Trophy, Medal, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContestLeaderboardProps {
  contestId: string;
  className?: string;
}

const ContestLeaderboard = ({ contestId, className = "" }: ContestLeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLeaderboard = async () => {
    if (!contestId) return;
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
  }, [contestId]);

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
      case 1: return 'text-yellow-400 font-bold';
      case 2: return 'text-gray-300 font-bold';
      case 3: return 'text-orange-400 font-bold';
      default: return 'text-muted-foreground';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return (
        <Medal
          className={`w-5 h-5 ${
            rank === 1 ? 'text-yellow-400' :
            rank === 2 ? 'text-gray-300' :
            'text-orange-400'
          }`}
        />
      );
    }
    return <span className="w-5 text-center font-mono">{rank}</span>;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Leaderboard</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button variant="ghost" size="sm" onClick={fetchLeaderboard} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only sm:not-sr-only sm:ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-border/30 overflow-hidden bg-card/30 backdrop-blur-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 sm:gap-4 px-4 py-3 bg-secondary/30 border-b border-border/30 text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-4">User</div>
          <div className="col-span-2 text-center">Score</div>
          <div className="col-span-2 text-center">Time</div>
          <div className="col-span-2 text-center text-destructive">Violations</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border/30 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 animate-pulse">
                <div className="col-span-2 flex justify-center"><div className="w-6 h-6 rounded-full bg-secondary" /></div>
                <div className="col-span-4"><div className="h-4 bg-secondary rounded w-24" /></div>
                <div className="col-span-2 flex justify-center"><div className="h-4 bg-secondary rounded w-8" /></div>
                <div className="col-span-2 flex justify-center"><div className="h-4 bg-secondary rounded w-12" /></div>
                <div className="col-span-2 flex justify-center"><div className="h-4 bg-secondary rounded w-8" /></div>
              </div>
            ))
          ) : entries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
                <p>No submissions yet.</p>
            </div>
          ) : (
            entries.map((entry, index) => {
              const rank = index + 1;
              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`grid grid-cols-12 gap-2 sm:gap-4 px-4 py-3 transition-colors items-center text-sm ${
                    rank <= 3 ? 'bg-primary/5' : 'hover:bg-secondary/30'
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-2 flex items-center justify-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                        rank === 1 ? 'bg-yellow-500/20 border border-yellow-500/50' :
                        rank === 2 ? 'bg-gray-300/20 border border-gray-300/50' :
                        rank === 3 ? 'bg-orange-500/20 border border-orange-500/50' :
                        'bg-secondary/50'
                    }`}>
                      {getRankIcon(rank)}
                    </div>
                  </div>

                  {/* Username */}
                  <div className="col-span-4 truncate font-medium">
                      <span className={getRankStyle(rank)}>{entry.username}</span>
                  </div>

                  {/* Score */}
                  <div className="col-span-2 text-center font-mono font-bold text-primary">
                    {entry.total_score}
                  </div>

                  {/* Time */}
                  <div className="col-span-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 hidden sm:block" />
                    <span className="font-mono">{formatTime(entry.total_time)}</span>
                  </div>

                  {/* Violations */}
                  <div className="col-span-2 flex items-center justify-center">
                    {entry.violation_count && entry.violation_count > 0 ? (
                      <div className="flex items-center gap-1 text-destructive font-bold" title={`${entry.violation_count} violations`}>
                          <AlertTriangle className="w-4 h-4" />
                          <span>{entry.violation_count}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/30">-</span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-2">
        Higher score wins • Ties broken by lower total time
      </p>
    </div>
  );
};

export default ContestLeaderboard;
