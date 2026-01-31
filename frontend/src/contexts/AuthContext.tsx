import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, authApi } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: {
    teamName: string;
    tlName: string;
    tlEmail: string;
    college: string;
    password: string;
    m1Name?: string;
    m1Email?: string;
    m1College?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user: userData } = await authApi.checkAuth();
        setUser(userData);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Try generic team login first
      await authApi.login(email, password).catch(async (err) => {
         // If team login fails, try admin login as fallback
         console.log("Team login failed, trying admin login fallback...");
         await authApi.adminLogin(email, password);
      });

      // After successful API call (cookie set), fetch user details
      const { user: userData } = await authApi.checkAuth();
      setUser(userData);
    } catch (error) {
       console.error("SignIn failed", error);
       throw error;
    }
  };

  const signUp = async (data: any) => {
    await authApi.register(data);
    const { user: userData } = await authApi.checkAuth();
    setUser(userData);
  };

  const signOut = async () => {
    try {
      await authApi.logout();
      setUser(null);
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
