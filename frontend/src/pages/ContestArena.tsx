import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ContestTimer from '@/components/contest/ContestTimer';
import CodeEditor from '@/components/contest/CodeEditor';
import { useToast } from '@/hooks/use-toast';
import { Problem, submissionApi, contestApi } from '@/lib/api';
import BefungeRunner from '@/components/contest/BefungeRunner';
import { useFullscreen } from '@/hooks/use-fullscreen';
import {
  ChevronLeft,
  ChevronRight,
  Send,
  BookOpen,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  Trophy,
  AlertTriangle,
  Code,
  FileText,
  Play,
  History,
  RotateCcw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ContestLeaderboard from "@/components/contest/ContestLeaderboard";

type SubmissionStatus = 'idle' | 'queued' | 'running' | 'accepted' | 'wrong' | 'error';

import { useAuth } from '@/contexts/AuthContext';

const ContestArena = () => {
  const { id: contestId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle');
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contestEndTime, setContestEndTime] = useState<Date | null>(null);
  const [hasEnteredContest, setHasEnteredContest] = useState(false);
  const [showRunner, setShowRunner] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const [showResources, setShowResources] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Submissions view state
  const [viewMode, setViewMode] = useState<'description' | 'submissions'>('description');
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isFullscreen, violations, enterFullscreen } = useFullscreen({
    reportToBackend: true,
    onViolation: async (event) => {
      if (contestId && user) {
        try {
          await contestApi.reportViolation(contestId, event.type, event.timestamp);
        } catch (error) {
          console.error("Failed to report violation", error);
        }
      }
    },
  });

  // Force interactions to trigger fullscreen if not active
  useEffect(() => {
    if (!isFullscreen && !isLoading && !isTimeUp) {
      // We can't auto-trigger due to browser policy, but we can show the overlay
      // The overlay is handled by the render logic below
    }
  }, [isFullscreen, isLoading, isTimeUp]);

  const handleEnterContest = async () => {
    const success = await enterFullscreen(containerRef.current || undefined);
    if (success) {
      setHasEnteredContest(true);
      toast({
        title: 'Contest Started',
        description: 'You are now in fullscreen mode. Good luck!',
        variant: 'default',
      });
    }
  };

  useEffect(() => {
    const joinContest = async () => {
        if (!contestId || !user) return;
        try {
            await contestApi.join(contestId);
        } catch (error: any) {
            console.error("Failed to join contest", error);
            // Don't redirect immediately on join failure if it's just a re-join, but api handles it.
             if (error.response?.status !== 200) {
                 toast({
                    title: "Error",
                    description: "Failed to join contest.",
                    variant: "destructive",
                });
                navigate('/api/contests');
             }
        }
    };
    joinContest();
  }, [contestId, user]);

  const fetchContestData = async () => {
      if (!contestId) return;
      try {
        const data = await contestApi.getById(contestId);
        
        // Update problems
        setProblems(data.problems);
        
        setSelectedProblem(prev => {
            if (!prev) return (data.problems.length > 0 ? data.problems[0] : null);
            // Stay on the same problem by ID to preserve current view
            const updated = data.problems.find(p => p.id === prev.id);
            return updated || prev;
        });
        
        // Update timer
        if (data.contest.end_time) {
            setContestEndTime(new Date(data.contest.end_time));
        }

        // Handle Pause
        setIsPaused(!!data.contest.is_paused);

      } catch (error: any) {
        console.error("Failed to fetch contest data", error);
         if (isLoading) { // Only show toast on first load to avoid spamming
            if (error.response && error.response.data && error.response.data.error) {
                toast({ 
                    title: "Access Denied", 
                    description: error.response.data.error, 
                    variant: "destructive" 
                });
            }
         }
      } finally {
        setIsLoading(false);
      }
  };

  // Initial Load
  useEffect(() => {
    fetchContestData();
    setIsLoading(true); // Set loading true initially
  }, [contestId]);

  // Polling
  useEffect(() => {
      if (!contestId) return;
      const interval = setInterval(fetchContestData, 10000);
      return () => clearInterval(interval);
  }, [contestId]);

    // Autosave: Load code
  useEffect(() => {
    if (contestId && selectedProblem) {
      const storageKey = `contest-${contestId}-problem-${selectedProblem.id}`;
      const savedCode = localStorage.getItem(storageKey);
      if (savedCode) {
        setCode(savedCode);
      } else {
        // Optional default template could go here
        setCode('');
      }
    }
  }, [contestId, selectedProblem]);

  // Autosave: Save code (debounced via effect)
  useEffect(() => {
    if (contestId && selectedProblem) {
       const storageKey = `contest-${contestId}-problem-${selectedProblem.id}`;
       // Only save if code is not empty to avoid overwriting with empty string on initial load if timings are off,
       // BUT we do want to verify if user deleted everything.
       // Actually, standard behavior is just save whatever is there.
       // We add a tiny delay or just save directly. Direct is fine for low volume.
       localStorage.setItem(storageKey, code);
    }
  }, [code, contestId, selectedProblem]);

  // Fetch submissions when view mode changes
  useEffect(() => {
    if (viewMode === 'submissions' && contestId && selectedProblem) {
        fetchSubmissions();
    }
  }, [viewMode, contestId, selectedProblem]);

  const fetchSubmissions = async () => {
    if (!contestId || !selectedProblem) return;
    setIsLoadingSubmissions(true);
    try {
        const data = await submissionApi.getUserSubmissions(contestId, selectedProblem.id);
        if (typeof data.submissions === 'string') {
             // Handle "No submissions found!" string response from backend
             setUserSubmissions([]);
        } else {
             setUserSubmissions(data.submissions);
        }
    } catch (error) {
        console.error("Failed to fetch submissions", error);
        toast({ title: "Error", description: "Failed to load submissions", variant: "destructive" });
    } finally {
        setIsLoadingSubmissions(false);
    }
  };

  const handleLoadCode = (submissionCode: string) => {
    // if (code.trim()) {
    //     return;
    // }
    setCode(submissionCode);
    toast({ title: "Code Loaded", description: "Submission code loaded into editor." });
    // setViewMode('description'); // Optional: switch back automatically
  };

   const handleSubmit = async () => {
    if (!selectedProblem || !code.trim() || isTimeUp || isPaused) return;

    setSubmissionStatus('queued');
    
    try {
      if (!user) {
        toast({ title: "Error", description: "You must be logged in to submit.", variant: "destructive" });
        return;
      }
      // API call
      const response = await submissionApi.submit({
        code: code,
        language: 'befunge93',
        problemId: selectedProblem.id,
        contestID: contestId!,
        userId: user.id
      });

      // Polling for result
      setSubmissionStatus('running');
      const startPoll = Date.now();
      
      const poll = setInterval(async () => {
        try {
            if (Date.now() - startPoll > 10000) {
                clearInterval(poll);
                setSubmissionStatus('error');
                toast({ title: "Timeout", description: "Submission timed out", variant: "destructive" });
                return;
            }
            const status = await submissionApi.getStatus(response.submissionId);
            if (status.status === 'completed' || status.status === 'failed') {
                clearInterval(poll);
                // Map status
                if (status.status === 'failed') {
                    setSubmissionStatus('error');
                } else if (status.result?.verdict === 'Accepted') {
                    setSubmissionStatus('accepted');
                    // Clear autosave
                    if (contestId && selectedProblem) {
                        const storageKey = `contest-${contestId}-problem-${selectedProblem.id}`;
                        localStorage.removeItem(storageKey);
                    }
                     toast({
                        title: 'Accepted!',
                        description: 'Great job! Your solution is correct.',
                        variant: 'success', // 'default' is usually green/success in this UI? check 
                      });
                } else if (status.result?.verdict === 'Wrong Answer') {
                    setSubmissionStatus('wrong');
                     toast({
                        title: 'Wrong Answer',
                         description: 'Your output doesn\'t match the expected output.',
                         variant: 'destructive',
                      });
                } else {
                    setSubmissionStatus('error'); // Error verdict
                     toast({
                         title: 'Execution Error',
                         description: status.result?.verdict || 'Code execution failed',
                         variant: 'destructive',
                      });
                }
            }
        } catch (e) {
            console.error(e);
        }
      }, 2000);

    } catch (error) {
      setSubmissionStatus('error');
      toast({
        title: 'Submission failed',
        description: 'Unable to submit your code. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = () => {
    switch (submissionStatus) {
      case 'queued':
      case 'running':
        return <Loader className="w-4 h-4 animate-spin" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-terminal-green" />;
      case 'wrong':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-warning-amber" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (submissionStatus) {
      case 'queued':
        return 'Queued...';
      case 'running':
        return 'Running...';
      case 'accepted':
        return 'Accepted';
      case 'wrong':
        return 'Wrong Answer';
      case 'error':
        return 'Error';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (!isFullscreen) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
        
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md w-full glass-card rounded-xl p-8 text-center relative z-10 border-primary/20"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 group">
            <Trophy className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Contest Mode</h2>
          <p className="text-muted-foreground mb-8">
            This contest requires fullscreen mode to ensure fair play. 
            Violations (exiting fullscreen) will be recorded.
          </p>

          <Button 
            size="lg" 
            className="w-full gap-2 relative overflow-hidden group"
            onClick={handleEnterContest}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
                Enter Contest environment <ChevronRight className="w-4 h-4" />
            </span>
            <div className="absolute inset-0 bg-primary/20 translate-y-full group-hover:translate-y-0 transition-transform" />
          </Button>

          {violations.length > 0 && (
             <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm font-semibold flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {violations.length} Violation(s) Recorded
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Please stay in fullscreen to avoid penalties.
                </p>
             </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
     <div ref={containerRef} className="h-screen flex flex-col bg-background overflow-hidden relative">

    {/* <div className="h-screen flex flex-col bg-background overflow-hidden"> */}
      {/* Top Navigation Bar */}
      <header className="h-14 flex items-center justify-between px-4 bg-card/80 backdrop-blur-sm border-b border-border/50 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/api/contests" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </Link>
          <div className="h-6 w-px bg-border" />
          {/* <h1 className="font-semibold text-foreground">Befunge Battle Arena - Round 1</h1> */}
        </div>

        <div className="flex items-center gap-4">
          {/* {violations.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive/10 border border-destructive/20 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-xs text-destructive font-bold font-mono">{violations.length} violations</span>
            </div>
          )} */}
          
          {contestEndTime && (
            <ContestTimer 
                endTime={contestEndTime} 
                isPaused={isPaused}
                onTimeUp={() => setIsTimeUp(true)} 
            />
          )}
          
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShowResources(true)}>
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Resources</span>
          </Button>
          
          {contestId && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => setShowLeaderboard(true)}>
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-border/50 bg-card/30 overflow-hidden shrink-0"
            >
              <div className="w-[280px] h-full flex flex-col">
                <div className="p-4 border-b border-border/50">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Problems
                  </h2>
                </div>
                <nav className="flex-1 overflow-y-auto p-2">
                  {problems.map((problem, index) => (
                    <button
                      key={problem.id}
                      onClick={() => setSelectedProblem(problem)}
                      className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-all duration-200 ${
                        selectedProblem?.id === problem.id
                          ? 'bg-primary/10 border border-primary/30 text-foreground'
                          : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="font-mono text-sm text-primary">#{index + 1}</span>
                      <span className="ml-2 text-sm">{problem.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 z-10 p-1.5 bg-secondary/80 border border-border/50 rounded-r-lg hover:bg-secondary transition-colors"
          style={{ left: sidebarOpen ? 280 : 0 }}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Main Split Pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* Problem Description Pane */}
          <div className="w-1/2 border-r border-border/50 overflow-y-auto p-6">
            <div className="flex items-center gap-2 mb-6 bg-secondary/30 p-1 rounded-lg w-fit">
                <Button
                    variant={viewMode === 'description' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('description')}
                    className="gap-2"
                >
                    <FileText className="w-4 h-4" />
                    Problem
                </Button>
                <Button
                    variant={viewMode === 'submissions' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('submissions')}
                    className="gap-2"
                >
                    <History className="w-4 h-4" />
                    Submissions
                </Button>
            </div>

            {viewMode === 'description' ? (
                selectedProblem && (
                <motion.div
                    key={selectedProblem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h2 className="text-2xl font-bold text-foreground mb-4">
                    {selectedProblem.name}
                    </h2>
                    
                    <div className="prose prose-invert max-w-none">
                    <section className="mb-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
                        <p className="text-muted-foreground">{selectedProblem.description}</p>
                    </section>

                    {selectedProblem.input_format && (
                        <section className="mb-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Input Format</h3>
                        <p className="text-muted-foreground">{selectedProblem.input_format}</p>
                        </section>
                    )}

                    {selectedProblem.output_format && (
                        <section className="mb-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Output Format</h3>
                        <p className="text-muted-foreground">{selectedProblem.output_format}</p>
                        </section>
                    )}

                    <section className="mb-6">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Example</h3>
                        <div className="grid gap-4">
                        <div className="glass-card rounded-lg p-4 border border-border/50">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Input</span>
                            <pre className="mt-2 text-sm font-mono text-foreground">
                            {selectedProblem.example_input || '(no input)'}
                            </pre>
                        </div>
                        <div className="glass-card rounded-lg p-4 border border-border/50">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Output</span>
                            <pre className="mt-2 text-sm font-mono text-terminal-green">
                            {selectedProblem.example_output}
                            </pre>
                        </div>
                        </div>
                    </section>
                    </div>
                </motion.div>
                )
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">Submission History</h3>
                        <Button size="sm" variant="ghost" onClick={fetchSubmissions} disabled={isLoadingSubmissions}>
                            Refresh
                        </Button>
                    </div>
                    
                    {isLoadingSubmissions ? (
                        <div className="flex justify-center p-8"><Loader className="animate-spin text-primary" /></div>
                    ) : userSubmissions.length === 0 ? (
                        <div className="text-center p-8 border border-dashed border-border/50 rounded-lg">
                            <History className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-muted-foreground">No submissions yet for this problem.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {userSubmissions.map((sub, idx) => (
                                <div key={idx} className="p-4 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${
                                                sub.verdict === 'Accepted' ? 'bg-terminal-green' : 
                                                sub.verdict === 'Wrong Answer' ? 'bg-destructive' : 'bg-warning-amber'
                                            }`} />
                                            <div>
                                                <div className={`text-sm font-bold ${
                                                    sub.verdict === 'Accepted' ? 'text-terminal-green' : 
                                                    sub.verdict === 'Wrong Answer' ? 'text-destructive' : 'text-foreground'
                                                }`}>
                                                    {sub.verdict || sub.status}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(sub.submitted_at).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" className="gap-1 h-8" onClick={() => handleLoadCode(sub.code)}>
                                            <RotateCcw className="w-3 h-3" />
                                            Load Code
                                        </Button>
                                    </div>
                                    <pre className="text-xs font-mono bg-secondary/30 p-3 rounded-md overflow-x-auto max-h-40 border border-border/30">
                                        {sub.code || "// Code not available in history"}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
          </div>

          {/* Code Editor Pane */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
              <div className="flex-1">
                <CodeEditor value={code} onChange={setCode} readOnly={isTimeUp} />
              </div>
              
              {/* Visual Runner Modal */}
              <Dialog open={showRunner} onOpenChange={setShowRunner}>
                <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-primary/20">
                  <DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                       <Play className="w-5 h-5 text-primary" />
                       Befunge Visualizer
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-hidden">
                    <BefungeRunner code={code} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Submit Bar */}
            <div className="p-4 border-t border-border/50 bg-card/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {submissionStatus !== 'idle' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50">
                      {getStatusIcon()}
                      <span className="text-sm font-mono">{getStatusText()}</span>
                    </div>
                  )}
                </div>
                

                <div className="flex items-center gap-2">
                  <Button
                    variant={showRunner ? 'terminal' : 'outline'}
                    size="default"
                    onClick={() => setShowRunner(!showRunner)}
                    className="gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Run / Debug
                  </Button>
                  
                  <Button
                    variant="glow"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isTimeUp || submissionStatus === 'queued' || submissionStatus === 'running' || !code.trim()}
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
            <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto glass-card">
                <ContestLeaderboard contestId={contestId || ""} />
            </DialogContent>
        </Dialog>

        <Sheet open={showResources} onOpenChange={setShowResources}>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto glass-card border-l border-border/50">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        Befunge-93 Resources
                    </SheetTitle>
                </SheetHeader>
                
                <div className="space-y-6">
                     <section>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Code className="w-4 h-4 text-primary" /> Commands
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {[
                                { c: '0-9', d: 'Push number' },
                                { c: '+ - * / %', d: 'Arithmetic' },
                                { c: '!', d: 'Logical NOT' },
                                { c: '`', d: 'Greater than' },
                                { c: '> < ^ v', d: 'Direction' },
                                { c: '?', d: 'Random dir' },
                                { c: '_ |', d: 'Horizontal/Vertical IF' },
                                { c: '"', d: 'String mode' },
                                { c: ': \\ $', d: 'Dup/Swap/Pop' },
                                { c: '. ,', d: 'Output Int/Char' },
                                { c: '#', d: 'Bridge (skip)' },
                                { c: 'p g', d: 'Put/Get' },
                                { c: '& ~', d: 'Input Int/Char' },
                                { c: '@', d: 'End program' },
                            ].map((i) => (
                                <div key={i.c} className="p-2 rounded bg-secondary/30 border border-border/30">
                                    <div className="font-mono text-primary font-bold">{i.c}</div>
                                    <div className="text-xs text-muted-foreground">{i.d}</div>
                                </div>
                            ))}
                        </div>
                     </section>
 
                     <section>
                        <h3 className="text-lg font-semibold mb-3">Tips</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>Stack behaves like LIFO.</li>
                            <li>"String mode" pushes ASCII values.</li>
                            <li>The grid wraps around edges (toroid).</li>
                            <li>Use <code>#</code> to jump over code.</li>
                        </ul>
                     </section>
                </div>
            </SheetContent>
        </Sheet>

        {/* Pause Overlay */}
        <AnimatePresence>
            {isPaused && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-md flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="glass-card p-12 rounded-2xl border-warning-amber/30 text-center max-w-lg shadow-2xl shadow-warning-amber/10"
                    >
                        <div className="w-20 h-20 bg-warning-amber/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-10 h-10 text-warning-amber animate-pulse" />
                        </div>
                        <h2 className="text-4xl font-black text-foreground mb-4 tracking-tight">CONTEST PAUSED</h2>
                        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                            The admin has temporarily paused the contest. 
                            The timer is frozen and submissions are locked.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-warning-amber font-mono font-bold animate-bounce">
                            <span className="w-2 h-2 rounded-full bg-warning-amber" />
                            AWAITING RESUME
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default ContestArena;
