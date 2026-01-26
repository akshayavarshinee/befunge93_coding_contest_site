import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

interface ContestTimerProps {
  endTime: Date;
  onTimeUp?: () => void;
}

const ContestTimer = ({ endTime, onTimeUp }: ContestTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();

      if (difference <= 0) {
        setIsExpired(true);
        onTimeUp?.();
        return { hours: 0, minutes: 0, seconds: 0 };
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      // Warning when less than 5 minutes remain
      setIsWarning(difference < 5 * 60 * 1000);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onTimeUp]);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  if (isExpired) {
    return (
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/20 border border-destructive/40"
      >
        <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
        <span className="font-mono text-lg text-destructive font-bold">TIME'S UP</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all duration-300 ${
        isWarning
          ? 'bg-destructive/10 border-destructive/40 animate-pulse'
          : 'bg-secondary/50 border-border/50'
      }`}
    >
      <Clock className={`w-5 h-5 ${isWarning ? 'text-destructive' : 'text-primary'}`} />
      <div className="flex items-center gap-1 font-mono text-xl font-bold">
        <AnimatePresence mode="wait">
          <motion.span
            key={timeLeft.hours}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className={isWarning ? 'text-destructive' : 'text-foreground'}
          >
            {formatNumber(timeLeft.hours)}
          </motion.span>
        </AnimatePresence>
        <span className={isWarning ? 'text-destructive' : 'text-muted-foreground'}>:</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={timeLeft.minutes}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className={isWarning ? 'text-destructive' : 'text-foreground'}
          >
            {formatNumber(timeLeft.minutes)}
          </motion.span>
        </AnimatePresence>
        <span className={isWarning ? 'text-destructive' : 'text-muted-foreground'}>:</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={timeLeft.seconds}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className={isWarning ? 'text-destructive' : 'text-foreground'}
          >
            {formatNumber(timeLeft.seconds)}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ContestTimer;
