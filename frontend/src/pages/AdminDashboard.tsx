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
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import ContestLeaderboard from '@/components/contest/ContestLeaderboard';


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
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'problems' | 'leaderboard'>('problems');

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
    test_cases: '',
    test_case_results: '',
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
        await contestApi.start(contestId);
        toast({ title: 'Contest Started', description: 'The contest is now live!' });
        
        const startTime = new Date().toISOString();
        setContests(prev => prev.map(c => 
            c.id === contestId ? { ...c, start_time: startTime, end_time: null } : c
        ));
        if (selectedContest?.id === contestId) {
            setSelectedContest(prev => prev ? { ...prev, start_time: startTime, end_time: null } : null);
        }
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to start contest', variant: 'destructive' });
    }
  };

  const handleEndContest = async (contestId: string) => {
    try {
        await contestApi.end(contestId);
        toast({ title: 'Contest Ended', description: 'The contest has been concluded.' });
        
        const endTime = new Date().toISOString();
        setContests(prev => prev.map(c => 
            c.id === contestId ? { ...c, end_time: endTime } : c
        ));
        if (selectedContest?.id === contestId) {
            setSelectedContest(prev => prev ? { ...prev, end_time: endTime } : null);
        }
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to end contest', variant: 'destructive' });
    }
  };

  const handleDeleteContest = async (contestId: string) => {


    try {
        await contestApi.delete(contestId);
        toast({ title: 'Contest Deleted', description: 'The contest has been permanently removed.' });
        setSelectedContest(null); // Clear selection
        fetchContests(); // Refresh list
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to delete contest', variant: 'destructive' });
    }
  };

  const handleResetContest = async (contestId: string) => {
    try {
        await contestApi.reset(contestId);
        toast({ title: 'Contest Reset', description: 'The contest has been reset. All leaderboard and submission data cleared.' });
        
        setContests(prev => prev.map(c => 
            c.id === contestId ? { ...c, start_time: null, end_time: null } : c
        ));
        if (selectedContest?.id === contestId) {
            setSelectedContest(prev => prev ? { ...prev, start_time: null, end_time: null } : null);
        }
    } catch (e) {
        toast({ title: 'Error', description: 'Failed to reset contest', variant: 'destructive' });
    }
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
    if (!newProblem.name.trim() || !selectedContest) return;

    try {
        const problemData = {
            ...newProblem,
            contestId: selectedContest.id,
            test_cases: newProblem.test_cases ? JSON.parse(newProblem.test_cases) : [],
            test_case_results: newProblem.test_case_results ? JSON.parse(newProblem.test_case_results) : []
        };

        if (editingProblemId) {
            await contestApi.updateProblem(editingProblemId, problemData);
            toast({ title: 'Problem Updated', description: `"${newProblem.name}" has been updated.` });
        } else {
            await contestApi.addProblem(selectedContest.id, problemData);
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
          test_cases: '',
          test_case_results: '',
        });
        fetchProblems(selectedContest.id);
    } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to save problem. Check JSON format.', variant: 'destructive' });
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
        test_cases: '',
        test_case_results: '',
    });
    setShowNewProblemModal(true);
    fetchProblems(selectedContest.id);
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
        test_cases: JSON.stringify(problem.test_cases || []),
        test_case_results: JSON.stringify(problem.test_case_results || []),
    });
    setShowNewProblemModal(true);
    fetchProblems(selectedContest.id);
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
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {selectedContest.name}
                  </h2>
                  <div className="flex-col items-center gap-4 text-sm text-muted-foreground">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        getContestStatus(selectedContest) === 'running'
                          ? 'bg-terminal-green/20 text-terminal-green'
                          : getContestStatus(selectedContest) === 'upcoming'
                          ? 'bg-info-cyan/20 text-info-cyan'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {getContestStatus(selectedContest).toUpperCase()}
                    </span>
                    <span className="flex-col items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedContest.duration} minutes
                      </div>
                      {/* <div className="space-y-2 mb-6"> */}
                      {selectedContest.start_time && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Start: {new Date(selectedContest.start_time).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedContest.end_time && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4" />
                          <span>End: {new Date(selectedContest.end_time).toLocaleString()}</span>
                        </div>
                      )}
                      {/* </div> */}
                    </span>
                    
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getContestStatus(selectedContest) === 'upcoming' && (
                    <Button
                      variant="success"
                      onClick={() => handleStartContest(selectedContest.id)}
                      className="gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Start Contest
                    </Button>
                  )}
                  {getContestStatus(selectedContest) === 'running' && (
                    <>
                      <Button
                        variant="danger"
                        onClick={() => handleEndContest(selectedContest.id)}
                        className="gap-2"
                      >
                        <Square className="w-4 h-4" />
                        End Contest
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleResetContest(selectedContest.id)}
                        className="gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Reset Contest
                      </Button>
                    </>
                  )}
                  {getContestStatus(selectedContest) === 'ended' && (
                    <Button
                      variant="outline"
                      onClick={() => handleResetContest(selectedContest.id)}
                      className="gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Reset Contest
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteContest(selectedContest.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete Contest"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 mb-6 bg-secondary/30 p-1 rounded-lg w-fit">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenNewProblem}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Problem
                  </Button>
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
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm text-primary">#{index + 1}</span>
                          <div>
                            <h4 className="font-medium text-foreground">{problem.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {problem.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditProblem(problem)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProblem(problem.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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
                <p className="text-muted-foreground">
                  Choose a contest from the sidebar to manage its problems
                </p>
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

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Hidden Test Cases (JSON array)
                    </label>
                    <Textarea
                      placeholder='["input1", "input2"]'
                      value={newProblem.test_cases}
                      onChange={(e) =>
                        setNewProblem((prev) => ({ ...prev, test_cases: e.target.value }))
                      }
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Expected Results (JSON array)
                    </label>
                    <Textarea
                      placeholder='["output1", "output2"]'
                      value={newProblem.test_case_results}
                      onChange={(e) =>
                        setNewProblem((prev) => ({ ...prev, test_case_results: e.target.value }))
                      }
                      rows={3}
                      className="font-mono text-sm"
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
      </div>
    </div>
  );
};

export default AdminDashboard;
