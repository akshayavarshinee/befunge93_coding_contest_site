import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Terminal, Trophy, BookOpen, LogOut, Shield, User } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { isAuthenticated, isAdmin, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Terminal className="w-8 h-8 text-primary transition-all duration-300 group-hover:text-glow-primary" />
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-bold text-xl text-foreground">
              <span className="text-primary text-glow-subtle">TALOS</span> <span className="eb-garamond-400 text-xl">Stranger Codes</span>
              {/* <img src="../../public/StrangerCodes.png" alt="Stranger Codes" height={250} width={240} className="align-y-center mt-1"/> */}
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/api/contests">
              <Button
                variant={isActive('/api/contests') ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Trophy className="w-4 h-4" />
                Contests
              </Button>
            </Link>
            <Link to="/resources">
              <Button
                variant={isActive('/resources') ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Resources
              </Button>
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50">
                  {isAdmin ? (
                    <Shield className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                </div>
                {isAdmin && (
                  <Link to="/api/admin/contests">
                    <Button variant="outline" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth/admin/login">
                  <Button variant="ghost" size="sm">
                    Admin
                  </Button>
                </Link>
                <Link to="/auth/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button variant="glow" size="sm">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
