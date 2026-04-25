'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const key = searchParams.get('key');

  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>();

  const password = watch('password');

  if (!key) {
    return (
      <div className="root-bg flex min-h-svh items-center justify-center">
        <div className="auth-form flex flex-col items-center">
          <div className="auth-form__card">
            <div className="auth-form__header items-start">
              <h1 className="auth-form__title">Invalid Reset Link</h1>
              <p className="auth-form__subtitle">This password reset link is invalid or has expired.</p>
            </div>
            <div className="auth-form__actions">
              <Link href="/forgot-password" className="auth-form__link hover:underline">
                Request a new reset link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordForm) => {
    setServerError('');
    try {
      await apiClient.post('/method/frappe.core.doctype.user.user.update_password', {
        new_password: data.password,
        key,
      });
      setSuccess(true);
    } catch {
      setServerError('Reset link is invalid or has expired.');
    }
  };

  return (
    <div className="root-bg flex min-h-svh items-center justify-center">
      <div className="auth-form flex flex-col items-center">
        <div className="auth-form__card">
          <div className="auth-form__header items-start">
            <h1 className="auth-form__title">Reset Password</h1>
            <p className="auth-form__subtitle">Enter your new password below.</p>
          </div>

          {success && (
            <div className="auth-form__success">
              Your password has been successfully reset.
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit(onSubmit)} className="auth-form__content">
              <div className="auth-form__fields">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New Password"
                    autoComplete="new-password"
                    className="auth-form__input bg-white pr-[2.5em]"
                    aria-invalid={!!errors.password}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive -mt-2">{errors.password.message}</p>
                )}

                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    className="auth-form__input bg-white pr-[2.5em]"
                    aria-invalid={!!errors.confirmPassword}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) => value === password || 'Passwords do not match',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive -mt-2">{errors.confirmPassword.message}</p>
                )}

                {serverError && <p className="auth-form__error text-destructive">{serverError}</p>}
              </div>

              <div className="auth-form__actions">
                <Button type="submit" disabled={isSubmitting} className="auth-form__button">
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting...</>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="auth-form__actions">
              <Link href="/login">
                <Button className="auth-form__button">Go to Login</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
