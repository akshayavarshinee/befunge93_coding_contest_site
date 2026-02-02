import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Contest, Problem, contestApi } from '@/lib/api';
import {
  LayoutDashboard,
  Trophy,
  Plus,
  Play,
  Square,
  Edit,
  Trash2,
  ChevronRight,
  Clock,
  FileText,
  LogOut,
  X,
  Save,
  Calendar,
  CheckCircle,
  Download,
  Settings,
  MoreVertical,
  ChevronDown,
  Trash,
  RefreshCw,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import ContestLeaderboard from '@/components/contest/ContestLeaderboard';
import ContestTimer from '@/components/contest/ContestTimer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";


const AdminDashboard = () => {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewContestModal, setShowNewContestModal] = useState(false);
  const [showNewProblemModal, setShowNewProblemModal] = useState(false);
  const [showAddExistingModal, setShowAddExistingModal] = useState(false);
  const [existingProblems, setExistingProblems] = useState<Problem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'problems' | 'leaderboard'>('problems');
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendMinutes, setExtendMinutes] = useState(10);
  const [showEditContestModal, setShowEditContestModal] = useState(false);
  const [editingContestData, setEditingContestData] = useState({ id: '', name: '', duration: 120 });

  // New contest form
  const [newContest, setNewContest] = useState({ name: '', duration: 120 });

  // New problem form
  const [newProblem, setNewProblem] = useState({
    name: '',
    description: '',
    input_format: '',
    output_format: '',
    example_input: '',
    example_output: '',
    test_cases: [] as { input: string; expected_output: string }[],
    points: 100,
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/auth/admin/login');
      return;
    }
    fetchContests();
  }, [isAdmin, navigate]);

  const fetchContests = async () => {
    setIsLoading(true);
    try {
        const data = await contestApi.adminGetAll();
        setContests(data);
    } catch (error) {
        console.error("Failed to fetch contests", error);
        toast({ title: "Error", description: "Could not load contests", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const fetchProblems = async (contestId: string) => {
    try {
        const data = await contestApi.adminGetProblems(contestId);
        setProblems(data);
    } catch (error) {
        console.error("Failed to fetch problems", error);
        toast({ title: "Error", description: "Could not load problems", variant: "destructive" });
    }
  };

  const handleSelectContest = (contest: Contest) => {
    setSelectedContest(contest);
    fetchProblems(contest.id);
  };

  const handleStartContest = async (contestId: string) => {
    try {
        const response = await contestApi.start(contestId);
        toast({ title: 'Contest Started', description: 'The contest is now live!' });
        
        if (response.contest) {
            const updated = response.contest;
            setContests(prev => prev.map(c => c.id === contestId ? updated : c));
            setSelectedContest(updated);
        } else {
            fetchContests();
        }
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to start contest', variant: 'destructive' });
    }
  };

  const handleEndContest = async (contestId: string) => {
    try {
        const response = await contestApi.end(contestId);
        toast({ title: 'Contest Ended', description: 'The contest has been concluded.' });
        
        if (response.contest) {
            const updated = response.contest;
            setContests(prev => prev.map(c => c.id === contestId ? updated : c));
            setSelectedContest(updated);
        } else {
            fetchContests();
        }
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to end contest', variant: 'destructive' });
    }
  };

  const handleDeleteContest = async (contestId: string) => {
    try {
        await contestApi.delete(contestId);
        toast({ title: 'Contest Deleted', description: 'The contest has been permanently removed.' });
        setSelectedContest(null); 
        fetchContests(); 
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to delete contest', variant: 'destructive' });
    }
  };

  const handleUpdateContest = async (contestId: string, name: string, duration: number) => {
    try {
        setShowEditContestModal(false);
        const response = await contestApi.update(contestId, name, duration);
        toast({ title: 'Contest Updated', description: 'The contest has been updated.' });
        
        if (response.contest) {
            const updated = response.contest;
            setContests(prev => prev.map(c => c.id === contestId ? updated : c));
            if (selectedContest?.id === contestId) {
                setSelectedContest(updated);
            }
        } else {
            fetchContests();
        }
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to update contest', variant: 'destructive' });
    }
  };

  const handleResetContest = async (contestId: string) => {
    try {
        const response = await contestApi.reset(contestId);
        toast({ title: 'Contest Reset', description: 'The contest has been reset.' });
        
        if (response.contest) {
            const updated = response.contest;
            setContests(prev => prev.map(c => c.id === contestId ? updated : c));
            if (selectedContest?.id === contestId) {
                setSelectedContest(updated);
            }
        } else {
            fetchContests();
        }
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to reset contest', variant: 'destructive' });
    }
  };

  const handlePauseContest = async (contestId: string) => {
    try {
        const response = await contestApi.pause(contestId);
        toast({ title: 'Contest Paused', description: 'Contest is now paused.' });
        
        if (response.contest) {
            const updated = response.contest;
            setContests(prev => prev.map(c => c.id === contestId ? updated : c));
            setSelectedContest(updated);
        } else {
            fetchContests();
        }
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to pause contest', variant: 'destructive' });
    }
  };

  const handleResumeContest = async (contestId: string) => {
    try {
        const response = await contestApi.resume(contestId);
        toast({ title: 'Contest Resumed', description: 'Contest is running again.' });
        
        if (response.contest) {
            const updated = response.contest;
            setContests(prev => prev.map(c => c.id === contestId ? updated : c));
            setSelectedContest(updated);
        } else {
            fetchContests();
        }
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to resume contest', variant: 'destructive' });
    }
  };

  const handleExtendContest = async () => {
    if (!selectedContest || !extendMinutes) return;
    try {
        const response = await contestApi.extend(selectedContest.id, extendMinutes);
        toast({ title: 'Contest Extended', description: `Added ${extendMinutes} minutes.` });
        
        const updatedContest = response.contest;
        setContests(prev => prev.map(c => c.id === selectedContest.id ? updatedContest : c));
        setSelectedContest(updatedContest);
        setShowExtendModal(false);
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to extend contest', variant: 'destructive' });
    }
  };

  const handleExportLeaderboard = async () => {
    if (!selectedContest) return;
    try {
        const blob = await contestApi.exportLeaderboard(selectedContest.id);
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `leaderboard_contest_${selectedContest.id}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        toast({ title: 'Export Successful', description: 'Leaderboard CSV downloaded.' });
    } catch (e) {
        console.error(e);
        toast({ title: 'Export Failed', description: 'Failed to download CSV.', variant: 'destructive' });
    }
  };

  const handleSearchProblems = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
        setExistingProblems([]);
        return;
    }
    try {
        const results = await contestApi.searchProblems(query);
        setExistingProblems(results);
    } catch (e) {
        console.error(e);
    }
  };

  const handleAddExistingProblem = async (problemId: string) => {
      if (!selectedContest) return;
      try {
          await contestApi.addExistingProblem(selectedContest.id, problemId, 100);
          toast({ title: "Success", description: "Problem added to contest" });
          fetchProblems(selectedContest.id);
          setShowAddExistingModal(false);
      } catch (e: any) {
          toast({ title: "Error", description: e.response?.data?.message || "Failed to add problem", variant: "destructive" });
      }
  };

  const openEditContestModal = (contest: Contest) => {
      setEditingContestData({
          id: contest.id,
          name: contest.name,
          duration: contest.duration
      });
      setShowEditContestModal(true);
  };

  const handleCreateContest = async () => {
    if (!newContest.name.trim()) return;

    try {
        await contestApi.create(newContest.name, newContest.duration, []);
        setShowNewContestModal(false);
        setNewContest({ name: '', duration: 120 });
        toast({ title: 'Contest Created', description: `"${newContest.name}" has been created.` });
        fetchContests();
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to create contest', variant: 'destructive' });
    }
  };

  const handleSaveProblem = async () => {
    if (!newProblem.name.trim()) return;

    try {
        const problemData = {
            ...newProblem,
            contestId: selectedContest?.id,
            // test_cases is already an array of objects
        };

        if (editingProblemId) {
            await contestApi.updateProblem(editingProblemId, problemData);
            toast({ title: 'Problem Updated', description: `"${newProblem.name}" has been updated.` });
        } else {
            await contestApi.addProblem(selectedContest?.id || '', problemData);
            toast({ title: 'Problem Created', description: `"${newProblem.name}" has been added.` });
        }
        
        setShowNewProblemModal(false);
        setEditingProblemId(null);
        setNewProblem({
          name: '',
          description: '',
          input_format: '',
          output_format: '',
          example_input: '',
          example_output: '',
          test_cases: [],
          points: 100,
        });
        if (selectedContest) fetchProblems(selectedContest.id);
    } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to save problem.', variant: 'destructive' });
    }
  };

  const handleOpenNewProblem = () => {
    setEditingProblemId(null);
    setNewProblem({
        name: '',
        description: '',
        input_format: '',
        output_format: '',
        example_input: '',
        example_output: '',
        test_cases: [{ input: '', expected_output: '' }],
        points: 100,
    });
    setShowNewProblemModal(true);
  };

  const handleEditProblem = (problem: Problem) => {
    setEditingProblemId(problem.id);
    
    setNewProblem({
        name: problem.name,
        description: problem.description,
        input_format: problem.input_format || '',
        output_format: problem.output_format || '',
        example_input: problem.example_input || '',
        example_output: problem.example_output || '',
        test_cases: problem.test_cases || [{ input: '', expected_output: '' }],
        points: problem.points || 100,
    });
    setShowNewProblemModal(true);
  };

  const addTestCase = () => {
    setNewProblem(prev => ({
      ...prev,
      test_cases: [...prev.test_cases, { input: '', expected_output: '' }]
    }));
  };

  const removeTestCase = (index: number) => {
    setNewProblem(prev => ({
      ...prev,
      test_cases: prev.test_cases.filter((_, i) => i !== index)
    }));
  };

  const updateTestCase = (index: number, field: 'input' | 'expected_output', value: string) => {
    setNewProblem(prev => ({
      ...prev,
      test_cases: prev.test_cases.map((tc, i) => 
        i === index ? { ...tc, [field]: value } : tc
      )
    }));
  };

  const handleDeleteProblem = async (problemId: string) => {
    // Implement delete API if exists
    // await contestApi.deleteProblem(problemId);
    // For now just refresh
    try {
        const data = await contestApi.deleteProblem(problemId);
        toast({ title: "Info", description: "Problem deleted successfully", variant: "default" });
        fetchProblems(selectedContest.id);
    } catch (error) {
        console.error("Failed to delete problem", error);
        toast({ title: "Error", description: "Could not delete problem", variant: "destructive" });
    }
  };

  const getContestStatus = (contest: Contest) => {
    if (!contest.start_time) return 'upcoming';
    if (contest.end_time && new Date(contest.end_time) < new Date()) return 'ended';
    return 'running';
  };

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  return (
    <div>
      {/* <Navbar /> */}
      <div className="min-h-screen bg-background flex">

        {/* Sidebar */}
        <aside className="w-64 border-r border-border/50 bg-card/30 p-4 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">TALOS Stranger Codes</p>
            </div>
          </div>

          <nav className="flex-1">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Contests
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowNewContestModal(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-secondary/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {contests.map((contest) => {
                    const status = getContestStatus(contest);
                    return (
                      <button
                        key={contest.id}
                        onClick={() => handleSelectContest(contest)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                          selectedContest?.id === contest.id
                            ? 'bg-primary/10 border border-primary/30 text-foreground'
                            : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{contest.name}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              status === 'running'
                                ? 'bg-terminal-green'
                                : status === 'upcoming'
                                ? 'bg-info-cyan'
                                : 'bg-muted-foreground'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          <Button variant="ghost" className="gap-2 justify-start" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {selectedContest ? (
            <motion.div
              key={selectedContest.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Contest Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedContest(null)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </Button>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">
                      {selectedContest.name}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                        getContestStatus(selectedContest) === 'running'
                          ? 'bg-terminal-green/10 text-terminal-green border-terminal-green/20'
                          : getContestStatus(selectedContest) === 'upcoming'
                          ? 'bg-info-cyan/10 text-info-cyan border-info-cyan/20'
                          : 'bg-muted/30 text-muted-foreground border-border/50'
                      }`}
                    >
                      {getContestStatus(selectedContest)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => openEditContestModal(selectedContest)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-full">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground ml-11">
                    <div className="flex items-center gap-1.5 opacity-80">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedContest.duration}m duration</span>
                    </div>
                    
                    {getContestStatus(selectedContest) === 'running' && selectedContest.end_time && (
                      <div className="flex items-center gap-3">
                         <div className="w-px h-3 bg-border/50" />
                         <ContestTimer 
                            endTime={new Date(selectedContest.end_time)} 
                            isPaused={selectedContest.is_paused}
                          />
                      </div>
                    )}

                    {(selectedContest.start_time || selectedContest.end_time) && (
                      <div className="flex items-center gap-3 opacity-60">
                        <div className="w-px h-3 bg-border/50" />
                        <div className="flex items-center gap-3">
                          {selectedContest.start_time && (
                            <span>Starts: {new Date(selectedContest.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                          {selectedContest.end_time && (
                            <span>Ends: {new Date(selectedContest.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Primary context-dependent button */}
                  {getContestStatus(selectedContest) === 'upcoming' && (
                    <Button
                      variant="success"
                      onClick={() => handleStartContest(selectedContest.id)}
                      className="gap-2 shadow-lg shadow-success/20"
                    >
                      <Play className="w-4 h-4" />
                      Start Contest
                    </Button>
                  )}

                  {getContestStatus(selectedContest) === 'running' && !selectedContest.is_paused && (
                     <Button
                        variant="warning"
                        onClick={() => handlePauseContest(selectedContest.id)}
                        className="gap-2 shadow-lg shadow-warning/20"
                     >
                        <Clock className="w-4 h-4" />
                        Pause
                     </Button>
                  )}
                  {/* Tertiary context-dependent button (End) */}
                  {getContestStatus(selectedContest) === 'running' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEndContest(selectedContest.id)}
                      className="text-destructive border-destructive/20 hover:bg-destructive/10"
                    >
                      End
                    </Button>
                  )}

                  {getContestStatus(selectedContest) === 'running' && selectedContest.is_paused && (
                     <Button
                        variant="success"
                        onClick={() => handleResumeContest(selectedContest.id)}
                        className="gap-2 shadow-lg shadow-success/20"
                     >
                        <Play className="w-4 h-4" />
                        Resume
                     </Button>
                  )}

                  {/* Secondary metadata button (Extend) */}
                  {getContestStatus(selectedContest) === 'running' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowExtendModal(true)}
                      className="gap-2 border-primary/30 hover:bg-primary/5"
                    >
                      <Plus className="w-4 h-4" />
                      Extend
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleExportLeaderboard}
                    className="gap-2 border-primary/30 hover:bg-primary/5"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>

                  {/* Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-secondary">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={() => handleResetContest(selectedContest.id)}
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reset Contest
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteContest(selectedContest.id)}
                        className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash className="w-4 h-4" />
                        Delete Contest
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 bg-secondary/30 p-1 rounded-lg w-fit">
                  <Button
                      variant={viewMode === 'problems' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('problems')}
                      className="gap-2"
                  >
                      <FileText className="w-4 h-4" />
                      Problems
                  </Button>
                  <Button
                      variant={viewMode === 'leaderboard' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('leaderboard')}
                      className="gap-2"
                  >
                      <Trophy className="w-4 h-4" />
                      Leaderboard
                  </Button>
                </div>
              </div>
              {/* Content */}
              {viewMode === 'leaderboard' ? (
                <ContestLeaderboard contestId={selectedContest.id} />
              ) : (
              /* Problems Section */
              <div className="glass-card rounded-xl border border-border/30 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-secondary/30 border-b border-border/30">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Problems
                  </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddExistingModal(true)}
                        className="h-8 text-xs hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Existing
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleOpenNewProblem}
                        className="h-8 text-xs shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Create New
                      </Button>
                    </div>
                </div>

                {problems.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No problems added yet</p>
                    <Button
                      variant="outline"
                      className="mt-4 gap-2"
                      onClick={handleOpenNewProblem}
                    >
                      <Plus className="w-4 h-4" />
                      Add First Problem
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {problems.map((problem, index) => (
                      <div
                        key={problem.id}
                        className="flex items-center justify-between px-6 py-4 hover:bg-secondary/20 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center font-mono text-xs text-muted-foreground border border-border/50">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-semibold text-foreground truncate">{problem.name}</h4>
                              {problem.points && (
                                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[10px] font-bold text-primary border border-primary/20">
                                  {problem.points}pts
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 opacity-70">
                              {problem.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleEditProblem(problem)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteProblem(problem.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Select a Contest</h3>
                <p className="text-muted-foreground mb-6">
                  Choose a contest from the sidebar to manage its problems, or create a standalone problem.
                </p>
                <Button variant="outline" className="gap-2" onClick={handleOpenNewProblem}>
                  <Plus className="w-4 h-4" />
                  Create Standalone Problem
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* New Contest Modal */}
        {showNewContestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-xl p-6 border border-border/30 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Create New Contest</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowNewContestModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Contest Name
                  </label>
                  <Input
                    placeholder="e.g., Befunge Battle Arena - Round 2"
                    value={newContest.name}
                    onChange={(e) => setNewContest((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    placeholder="120"
                    value={newContest.duration}
                    onChange={(e) =>
                      setNewContest((prev) => ({ ...prev, duration: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowNewContestModal(false)}>
                  Cancel
                </Button>
                <Button variant="glow" onClick={handleCreateContest} className="gap-2">
                  <Save className="w-4 h-4" />
                  Create Contest
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Contest Modal */}
        {showEditContestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-xl p-6 border border-border/30 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Edit Contest</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowEditContestModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Contest Name
                  </label>
                  <Input
                    placeholder="e.g., Befunge Battle Arena - Round 2"
                    value={editingContestData.name}
                    onChange={(e) => setEditingContestData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    placeholder="120"
                    value={editingContestData.duration}
                    onChange={(e) =>
                        setEditingContestData((prev) => ({ ...prev, duration: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowEditContestModal(false)}>
                  Cancel
                </Button>
                <Button variant="glow" onClick={() => handleUpdateContest(editingContestData.id, editingContestData.name, editingContestData.duration)} className="gap-2">
                  <Save className="w-4 h-4" />
                  Update Contest
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* New Problem Modal */}
        {showNewProblemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-xl p-6 border border-border/30 w-full max-w-2xl mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">{editingProblemId ? 'Edit Problem' : 'Add New Problem'}</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowNewProblemModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Title</label>
                  <Input
                    placeholder="Problem title"
                    value={newProblem.name}
                    onChange={(e) => setNewProblem((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="Problem description"
                    value={newProblem.description}
                    onChange={(e) =>
                      setNewProblem((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={4}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Input Format
                    </label>
                    <Textarea
                      placeholder="Describe input format"
                      value={newProblem.input_format}
                      onChange={(e) =>
                        setNewProblem((prev) => ({ ...prev, input_format: e.target.value }))
                      }
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Output Format
                    </label>
                    <Textarea
                      placeholder="Describe output format"
                      value={newProblem.output_format}
                      onChange={(e) =>
                        setNewProblem((prev) => ({ ...prev, output_format: e.target.value }))
                      }
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Example Input
                    </label>
                    <Textarea
                      placeholder="Example input"
                      value={newProblem.example_input}
                      onChange={(e) =>
                        setNewProblem((prev) => ({ ...prev, example_input: e.target.value }))
                      }
                      rows={2}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Example Output
                    </label>
                    <Textarea
                      placeholder="Example output"
                      value={newProblem.example_output}
                      onChange={(e) =>
                        setNewProblem((prev) => ({ ...prev, example_output: e.target.value }))
                      }
                      rows={2}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Test Cases
                    </label>
                    <Button variant="outline" size="sm" onClick={addTestCase} className="gap-2">
                       <Plus className="w-4 h-4" />
                       Add Case
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                      {newProblem.test_cases.map((tc, index) => (
                          <div key={index} className="p-4 rounded-lg bg-secondary/20 border border-border/30 relative">
                               <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeTestCase(index)} 
                                  className="absolute top-2 right-2 text-destructive h-8 w-8"
                                  disabled={newProblem.test_cases.length === 1}
                               >
                                  <Trash2 className="w-4 h-4" />
                               </Button>

                               <div className="grid sm:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Input</label>
                                    <Textarea
                                        placeholder="Input for test case"
                                        value={tc.input}
                                        onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                                        rows={2}
                                        className="font-mono text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Expected Output</label>
                                    <Textarea
                                        placeholder="Expected result"
                                        value={tc.expected_output}
                                        onChange={(e) => updateTestCase(index, 'expected_output', e.target.value)}
                                        rows={2}
                                        className="font-mono text-sm"
                                    />
                                  </div>
                               </div>
                          </div>
                      ))}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Points
                    </label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={newProblem.points}
                      onChange={(e) =>
                        setNewProblem((prev) => ({ ...prev, points: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/30">
                <Button variant="ghost" onClick={() => setShowNewProblemModal(false)}>
                  Cancel
                </Button>
                <Button variant="glow" onClick={handleSaveProblem} className="gap-2">
                  <Save className="w-4 h-4" />
                  {editingProblemId ? 'Update Problem' : 'Add Problem'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Extend Contest Modal */}
        {showExtendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-xl p-6 border border-border/30 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Extend Contest</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowExtendModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Extra Minutes
                  </label>
                  <Input
                    type="number"
                    value={extendMinutes}
                    onChange={(e) => setExtendMinutes(Number(e.target.value))}
                    min={1}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowExtendModal(false)}>
                  Cancel
                </Button>
                <Button variant="glow" onClick={handleExtendContest} className="gap-2">
                  <Clock className="w-4 h-4" />
                  Extend
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Existing Problem Modal */}
        {showAddExistingModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card rounded-xl p-6 border border-border/30 w-full max-w-lg"
                >
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-foreground">Add Existing Problem</h3>
                        <Button variant="ghost" size="icon" onClick={() => setShowAddExistingModal(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    
                    <Input 
                        placeholder="Search problems by name..." 
                        value={searchQuery}
                        onChange={(e) => handleSearchProblems(e.target.value)}
                        className="mb-4"
                    />
                    
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {existingProblems.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50">
                                <div>
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                                </div>
                                <Button size="sm" onClick={() => handleAddExistingProblem(p.id)}>
                                    Add
                                </Button>
                            </div>
                        ))}
                        {existingProblems.length === 0 && searchQuery && (
                            <div className="text-center text-muted-foreground p-4">No problems found.</div>
                        )}
                    </div>
                </motion.div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
