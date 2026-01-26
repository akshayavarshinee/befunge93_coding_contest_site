import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AntiCheatEvent {
  type: 'fullscreen_exit' | 'tab_switch' | 'focus_lost' | 'visibility_change';
  timestamp: string;
}

interface UseFullscreenOptions {
  onViolation?: (event: AntiCheatEvent) => void;
  reportToBackend?: boolean;
}

export const useFullscreen = (options: UseFullscreenOptions = {}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState<AntiCheatEvent[]>([]);
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const reportViolation = useCallback((event: AntiCheatEvent) => {
    setViolations((prev) => [...prev, event]);
    
    if (options.onViolation) {
      options.onViolation(event);
    }

    // Report to backend
    if (options.reportToBackend) {
      // In production: api.post('/api/violations', event);
      console.log('[Anti-Cheat] Violation reported:', event);
    }

    toast({
      title: 'Warning: Contest Violation Detected',
      description: getViolationMessage(event.type),
      variant: 'destructive',
    });
  }, [options, toast]);

  const getViolationMessage = (type: AntiCheatEvent['type']) => {
    switch (type) {
      case 'fullscreen_exit':
        return 'You exited fullscreen mode. This has been recorded.';
      case 'tab_switch':
        return 'You switched tabs. This has been recorded.';
      case 'focus_lost':
        return 'You clicked outside the contest window. This has been recorded.';
      case 'visibility_change':
        return 'You navigated away from the contest. This has been recorded.';
      default:
        return 'A violation has been detected and recorded.';
    }
  };

  const enterFullscreen = useCallback(async (element?: HTMLElement) => {
    try {
      const target = element || containerRef.current || document.documentElement;
      
      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if ((target as any).webkitRequestFullscreen) {
        await (target as any).webkitRequestFullscreen();
      } else if ((target as any).msRequestFullscreen) {
        await (target as any).msRequestFullscreen();
      }
      
      setIsFullscreen(true);
      return true;
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      toast({
        title: 'Fullscreen Required',
        description: 'Please allow fullscreen mode to participate in the contest.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      
      if (isFullscreen && !isNowFullscreen) {
        reportViolation({
          type: 'fullscreen_exit',
          timestamp: new Date().toISOString(),
        });
      }
      
      setIsFullscreen(isNowFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen, reportViolation]);

  // Monitor tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isFullscreen && document.visibilityState === 'hidden') {
        reportViolation({
          type: 'visibility_change',
          timestamp: new Date().toISOString(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isFullscreen, reportViolation]);

  // Monitor focus loss
  useEffect(() => {
    const handleBlur = () => {
      if (isFullscreen) {
        reportViolation({
          type: 'focus_lost',
          timestamp: new Date().toISOString(),
        });
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [isFullscreen, reportViolation]);

  return {
    isFullscreen,
    violations,
    enterFullscreen,
    exitFullscreen,
    containerRef,
  };
};
