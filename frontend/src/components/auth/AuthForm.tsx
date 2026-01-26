import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Terminal, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, UserRound } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(255, 'Username too long'),
});

type AuthFormData = z.infer<typeof authSchema>;

interface AuthFormProps {
  mode: 'login' | 'register' | 'admin';
}

const AuthForm = ({ mode }: AuthFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      if (mode === 'register') {
        await signUp(data.email, data.password, data.username);
        toast({
          title: 'Registration successful!',
          description: 'Welcome to TALOS Stranger Codes.',
        });
        navigate('/api/contests');
      } else {
        // Login and Admin Login use the same signIn method
        await signIn(data.email, data.password, data.username);
        
        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in.',
        });
        
        if (mode === 'admin') {
             navigate('/api/admin/contests');
        } else {
             navigate('/api/contests');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Authentication failed',
        description: error.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const titles = {
    login: 'Access Terminal',
    register: 'Initialize Account',
    admin: 'Admin Access',
  };

  const descriptions = {
    login: 'Enter your credentials to continue',
    register: 'Create your account to compete',
    admin: 'Restricted access point',
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center px-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 max-w-4xl flex flex-col lg:flex-row items-center gap-10"
      >
        {/* Header */}
        <div className="w-full lg:w-1/2 max-w-full text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4"
          >
            {mode === 'admin' ? (
              <Shield className="w-8 h-8 text-primary" />
            ) : (
              <Terminal className="w-8 h-8 text-primary animate-pulse-glow" />
            )}
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{titles[mode]}</h1>
          <p className="text-muted-foreground">{descriptions[mode]}</p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-1/2 max-w-full glass-card rounded-2xl p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <UserRound className="w-4 h-4 text-muted-foreground" />
                Username
              </label>
              <Input
                {...register('username')}
                type="text"
                placeholder="username"
                variant="glass"
                className={errors.username ? 'border-destructive' : ''}
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="your@email.com"
                variant="glass"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Password
              </label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  variant="glass"
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="glow"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'register' ? 'Create Account' : 'Login'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            {mode === 'login' && (
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/auth/register" className="text-primary hover:underline">
                  Register now
                </Link>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/auth/login" className="text-primary hover:underline">
                  Login here
                </Link>
              </p>
            )}
            {mode !== 'admin' && (
              <p className="text-sm text-muted-foreground mt-2">
                <Link to="/auth/admin/login" className="text-muted-foreground hover:text-primary transition-colors">
                  Admin Login →
                </Link>
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthForm;
