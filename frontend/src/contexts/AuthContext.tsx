import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, authApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Removed role: 'admin' | 'user' from User interface as isAdmin boolean handles it
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, username?: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  // We can access navigation here if AuthProvider is rendered inside BrowserRouter
  // But typically Providers are higher up. For redirection logic, it's safer to handle in components or use a wrapper.
  // However, simple state updates are fine.

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user: userData } = await authApi.checkAuth();
        setUser(userData);
      } catch (error) {
        // Not authenticated
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string, username?: string) => {
    try {
      // Try generic user login first
      // We pass username if available, as backend might strictly require it
      await authApi.login(username || "", email, password).catch(async (err) => {
         // If user login fails, and we have an email, try admin login as fallback
         // Admin login allows "email OR username"
         console.log("User login failed, trying admin login...", err);
         await authApi.adminLogin(username || "", email, password);
      });

      // After successful API call (cookie set), fetch user details
      const { user: userData } = await authApi.checkAuth();
      setUser(userData);
    } catch (error) {
       console.error("SignIn failed", error);
       throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    await authApi.register(username, email, password);
    // Auto login after register? 
    // The backend register endpoint sets the cookie! (Lines 135-140 in index.js)
    // So we just need to update state.
    
    const { user: userData } = await authApi.checkAuth();
    setUser(userData);
  };

  const signOut = async () => {
    try {
      await authApi.logout();
      setUser(null);
      // Optional: Navigate to home, but that's usually done by component
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
