import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, CheckCircle, Calendar, Users } from 'lucide-react';
import { Contest } from '@/lib/api';

interface ContestCardProps {
  contest: Contest;
  index: number;
}

type ContestStatus = 'upcoming' | 'running' | 'ended';

const getContestStatus = (contest: Contest): ContestStatus => {
  const now = new Date();
  if (!contest.start_time) return 'upcoming';
  
  const startTime = new Date(contest.start_time);
  const endTime = contest.end_time ? new Date(contest.end_time) : null;
  
  if (now < startTime) return 'upcoming';
  if (endTime && now > endTime) return 'ended';
  return 'running';
};

const statusConfig = {
  upcoming: {
    label: 'Upcoming',
    icon: Calendar,
    className: 'status-upcoming',
    borderClass: 'border-info-cyan/30 hover:border-info-cyan/50',
  },
  running: {
    label: 'Live Now',
    icon: Play,
    className: 'status-running',
    borderClass: 'border-terminal-green/30 hover:border-terminal-green/50',
  },
  ended: {
    label: 'Ended',
    icon: CheckCircle,
    className: 'status-ended',
    borderClass: 'border-border hover:border-border',
  },
};

const ContestCard = ({ contest, index }: ContestCardProps) => {
  const status = getContestStatus(contest);
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div
        className={`glass-card rounded-xl p-6 border transition-all duration-300 hover-glow`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">{contest.name}</h3>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(contest.duration)}</span>
            </div>
          </div>
          <Badge className={`${config.className} gap-1.5`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {config.label}
          </Badge>
        </div>

        {/* Time Info */}
        <div className="space-y-2 mb-6">
          {contest.start_time && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Start: {new Date(contest.start_time).toLocaleString()}</span>
            </div>
          )}
          {contest.end_time && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              <span>End: {new Date(contest.end_time).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {status === 'running' ? (
          <Link to={`/api/contest/${contest.id}`}>
            <Button variant="glow" className="w-full gap-2">
              <Play className="w-4 h-4" />
              Enter Contest
            </Button>
          </Link>
        ) : status === 'upcoming' ? (
          <Button variant="outline" className="w-full" disabled>
            <Calendar className="w-4 h-4 mr-2" />
            Not Started Yet
          </Button>
        ) : (
          <Link to={`/api/leaderboard?contestId=${contest.id}`}>
            <Button variant="secondary" className="w-full gap-2">
              <Users className="w-4 h-4" />
              View Results
            </Button>
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default ContestCard;
