'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { SmylsLogo } from '@/components/icons/SmylsLogo';
import { Button } from '@/components/ui/button';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError, isAgent } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    clearError();
    try {
      await login({ usr: data.email, pwd: data.password });
      // Role detection happens in login — check after it completes
      const state = (await import('@/store/auth')).useAuthStore.getState();
      router.push(state.isAgent ? '/admin' : '/dashboard');
    } catch {
      // Error is already set in the auth store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-smyls-blue-50">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-6">
          <SmylsLogo size={64} />
          <h1 className="text-2xl font-bold text-center">
            <span className="text-foreground/45">Login to</span>
            <span className="text-foreground"> SMYLS Support</span>
            <span className="text-primary">.</span>
          </h1>
        </div>

        <Card className="shadow-sm border-0 p-10">
          <CardContent className="p-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email Address"
                    disabled={isLoading}
                    className="h-12 px-4 rounded-xl border-2 border-zinc-300 text-sm"
                    aria-invalid={!!errors.email}
                    {...register('email', { required: 'Email is required' })}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      disabled={isLoading}
                      className="h-12 px-4 pr-12 rounded-xl border-2 border-zinc-300 text-sm"
                      aria-invalid={!!errors.password}
                      {...register('password', { required: 'Password is required' })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="text-right mt-2">
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-link hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-semibold text-xs"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
