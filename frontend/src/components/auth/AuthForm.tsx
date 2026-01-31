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
import { Terminal, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, UserRound, Loader } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  // Registration only fields
  teamName: z.string().min(3, 'Team name too short').optional(),
  tlName: z.string().min(2, 'Name too short').optional(),
  college: z.string().min(2, 'College name too short').optional(),
  // Optional member fields
  m1Name: z.string().optional(),
  m1Email: z.string().email('Invalid email address').optional().or(z.literal('')),
  m1College: z.string().optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

interface AuthFormProps {
  mode: 'login' | 'register' | 'admin';
}

const AuthForm = ({ mode }: AuthFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMember2, setShowMember2] = useState(false);
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
        await signUp({
          teamName: data.teamName,
          tlName: data.tlName,
          tlEmail: data.email,
          college: data.college,
          password: data.password,
          m1Name: data.m1Name,
          m1Email: data.m1Email,
          m1College: data.m1College
        });
        toast({
          title: 'Registration successful!',
          description: 'Team created. Welcome to the contest!',
        });
        navigate('/api/contests');
      } else {
        await signIn(data.email, data.password);
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
        description: error.response?.data?.message || 'Please check your credentials.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const titles = {
    login: 'Team Login',
    register: 'Initialize Team',
    admin: 'Admin Console',
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12 overflow-y-auto`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl flex flex-col items-center gap-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4"
          >
            {mode === 'admin' ? <Shield className="w-8 h-8 text-primary" /> : <Terminal className="w-8 h-8 text-primary" />}
          </motion.div>
          <h1 className="text-4xl font-black text-foreground mb-2 tracking-tight uppercase">{titles[mode]}</h1>
          <p className="text-muted-foreground">{mode === 'register' ? 'Register your team and members' : 'Enter your credentials to continue'}</p>
        </div>

        <motion.div className="w-full glass-card rounded-2xl p-8 border-primary/10 shadow-2xl shadow-primary/5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {mode === 'register' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border/50">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary">Team Details</label>
                  <Input {...register('teamName')} placeholder="The Debuggers" variant="glass" />
                  {errors.teamName && <p className="text-xs text-destructive">{errors.teamName.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Team Leader Name</label>
                  <Input {...register('tlName')} placeholder="John Doe" variant="glass" />
                  {errors.tlName && <p className="text-xs text-destructive">{errors.tlName.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">College</label>
                  <Input {...register('college')} placeholder="MIT" variant="glass" />
                  {errors.college && <p className="text-xs text-destructive">{errors.college.message}</p>}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-primary">Authentication</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">{mode === 'register' ? 'Leader Email' : 'Email'}</label>
                    <Input {...register('email')} type="email" placeholder="john@example.com" variant="glass" />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                        <Input
                            {...register('password')}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            variant="glass"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-6 pt-6 border-t border-border/50">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary">Optional Member</label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowMember2(!showMember2)}>
                        {showMember2 ? 'Remove' : 'Add Member'}
                    </Button>
                </div>

                {showMember2 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input {...register('m1Name')} placeholder="Jane Doe" variant="glass" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input {...register('m1Email')} type="email" placeholder="jane@example.com" variant="glass" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">College</label>
                            <Input {...register('m1College')} placeholder="MIT" variant="glass" />
                        </div>
                    </motion.div>
                )}
              </div>
            )}

            <Button type="submit" variant="glow" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : (
                <>{mode === 'register' ? 'Register Team' : 'Sign In'} <ArrowRight className="ml-2 w-4 h-4" /></>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/50 text-center space-y-2">
            {mode === 'login' ? (
              <p className="text-sm text-muted-foreground">New participating team? <Link to="/auth/register" className="text-primary hover:underline font-bold">Register here</Link></p>
            ) : mode === 'register' ? (
              <p className="text-sm text-muted-foreground">Already registered? <Link to="/auth/login" className="text-primary hover:underline font-bold">Login here</Link></p>
            ) : null}
            
            {mode !== 'admin' && (
              <Link to="/auth/admin/login" className="block text-xs text-muted-foreground hover:text-primary mt-4">Admin Dashboard Area →</Link>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthForm;
