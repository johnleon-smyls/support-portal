'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    clearError();
    try {
      await login({ usr: data.email, pwd: data.password });
      const state = (await import('@/store/auth')).useAuthStore.getState();
      router.push(state.isAgent ? '/admin' : '/dashboard');
    } catch {
      // Error is set in the auth store
    }
  };

  return (
    <div className="root-bg flex min-h-svh items-center justify-center">
      <div className="auth-form flex flex-col items-center">
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form__card">
          <div className="auth-form__header items-center">
            <Image
              src="/smyls-support-logo.png"
              alt="SMYLS Support"
              width={280}
              height={60}
              className="auth-form__logo h-auto"
              priority
            />
          </div>

          <div className="auth-form__content">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="auth-form__error">{error}</AlertDescription>
              </Alert>
            )}

            <div className="auth-form__fields">
              <Input
                type="email"
                placeholder="Email Address"
                autoComplete="email"
                disabled={isLoading}
                className="auth-form__input bg-white"
                aria-invalid={!!errors.email}
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && (
                <p className="text-sm text-destructive -mt-2">{errors.email.message}</p>
              )}

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="auth-form__input bg-white pr-[2.5em]"
                  aria-invalid={!!errors.password}
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="auth-form__actions">
              <Button
                type="submit"
                className="auth-form__button"
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
              <Link
                href="/forgot-password"
                className="auth-form__link hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
