import axios from 'axios';

// Configure base URL - will be replaced with actual backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add CSRF token
api.interceptors.request.use((config) => {
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrfToken='))
    ?.split('=')[1];
  
  if (csrfToken) {
    config.headers['x-csrf-token'] = csrfToken;
  }
  return config;
});

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin?: boolean;
}

export interface Contest {
  id: string;
  name: string;
  duration: number;
  start_time: string | null;
  end_time: string | null;
  is_paused?: boolean;
  paused_at?: string;
  total_paused_duration?: number;
}

export interface Problem {
  id: string;
  name: string;
  description: string;
  input_format?: string;
  output_format?: string;
  example_input?: string;
  example_output?: string;
  test_cases?: any[]; // Changed to any[] to support object structure
  points?: number;
  contest_id: string;
}

export interface Submission {
  submissionId: string;
  status: 'queued' | 'active' | 'completed' | 'failed';
  result?: {
    verdict: string;
    output?: string;
  };
  failedReason?: string;
  submittedAt: string;
}

export interface LeaderboardEntry {
  rank?: number;
  user_id: string;
  username: string;
  total_score: number;
  total_time: number;
  violation_count?: number;
}

// Auth APIs
export const authApi = {
  register: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { username, email, password});
    return response.data;
  },

  login: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/login', { username, email, password});
    return response.data;
  },

  adminLogin: async (username: string, email: string, password: string) => {
    const response = await api.post('/auth/admin/login', { username, email, password});
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  checkAuth: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Contest APIs
export const contestApi = {
  getAll: async (): Promise<Contest[]> => {
    const response = await api.get('/api/contest');
    return response.data;
  },

  getById: async (id: string): Promise<{ contest: Contest; problems: Problem[] }> => {
    const response = await api.get(`/api/contest/${id}`);
    return response.data;
  },

  join: async (id: string) => {
    const response = await api.post(`/api/contests/${id}/join`);
    return response.data;
  },

  reportViolation: async (id: string, type: string, timestamp: string) => {
    const response = await api.post(`/api/contests/${id}/report-violation`, { type, timestamp });
    return response.data;
  },

  // Admin APIs
  adminGetAll: async (): Promise<Contest[]> => {
    const response = await api.get('/api/admin/contests');
    return response.data;
  },

  adminGetProblems: async (contestId: string): Promise<Problem[]> => {
    const response = await api.get(`/api/admin/contests/${contestId}/problems`);
    return response.data;
  },

  create: async (name: string, duration: number, problems: Problem[]) => {
    const response = await api.post('/api/admin/contests', { name, duration, problems });
    return response.data;
  },

  addProblem: async (contestId: string, data: any) => {
    const response = await api.post('/api/admin/problems', { ...data, contestId });
    return response.data;
  },

  updateProblem: async (problemId: string, data: any) => {
    const response = await api.put(`/api/admin/problems`, { ...data, problemId });
    return response.data;
  },

  deleteProblem: async (problemId: string) => {
    const response = await api.delete(`/api/admin/problems`, {data: {id: problemId}});
    return response.data;
  },

  start: async (id: string) => {
    const response = await api.post(`/api/admin/contests/${id}/start`);
    return response.data;
  },

  end: async (id: string) => {
    const response = await api.post(`/api/admin/contests/${id}/end`);
    return response.data;
  },

  pause: async (id: string) => {
    const response = await api.post(`/api/admin/contests/${id}/pause`);
    return response.data;
  },

  resume: async (id: string) => {
    const response = await api.post(`/api/admin/contests/${id}/resume`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/api/admin/contests/${id}`);
    return response.data;
  },

  reset: async (id: string) => {
    const response = await api.post(`/api/admin/contests/${id}/reset`);
    return response.data;
  },

  extend: async (id: string, minutes: number) => {
    const response = await api.post(`/api/admin/contests/${id}/extend`, { minutes });
    return response.data;
  },

  searchProblems: async (query: string): Promise<Problem[]> => {
    const response = await api.get(`/api/admin/problems/search?q=${query}`);
    return response.data;
  },

  addExistingProblem: async (contestId: string, problemId: string, points: number) => {
    const response = await api.post(`/api/admin/contests/${contestId}/problems`, { problemId, points });
    return response.data;
  },
};

// Submission APIs
export const submissionApi = {
  submit: async (data: { userId: string; contestID: string; problemId: string; code: string; language: string }): Promise<{ submissionId: string; status: string }> => {
    const response = await api.post('/api/submissions', data);
    return response.data;
  },

  getStatus: async (id: string): Promise<Submission> => {
    const response = await api.get(`/api/submissions/${id}`);
    return response.data;
  },

  getUserSubmissions: async (contestID: string, problemId: string): Promise<{submissions: any[] | string}> => {
    const response = await api.get(`/api/submissions?contestID=${contestID}&problemId=${problemId}`);
    return response.data;
  }
};

// Leaderboard APIs
export const leaderboardApi = {
  get: async (contestId: string): Promise<LeaderboardEntry[]> => {
    const response = await api.get(`/api/leaderboard?contestId=${contestId}`);
    return response.data;
  },
};

export default api;
