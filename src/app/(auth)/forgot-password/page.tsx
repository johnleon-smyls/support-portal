'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setServerError('');
    try {
      await apiClient.resetPassword(data.email.trim().toLowerCase());
      setSuccess(true);
    } catch {
      setServerError('Request failed. Please try again later.');
    }
  };

  return (
    <div className="root-bg flex min-h-svh items-center justify-center">
      <div className="auth-form flex flex-col items-center">
        <div className="auth-form__card">
          <div className="auth-form__header items-start">
            <h1 className="auth-form__title">Forgot your password?</h1>
            <p className="auth-form__subtitle">Enter your email and we&apos;ll send you a reset link.</p>
          </div>

          {success && (
            <div className="auth-form__success">
              Password reset instructions have been sent to your email.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form__content">
            <div className="auth-form__fields">
              <Input
                type="email"
                placeholder="Email Address"
                autoComplete="email"
                className="auth-form__input bg-white"
                aria-invalid={!!errors.email}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })}
              />
              {errors.email && (
                <p className="text-sm text-destructive -mt-2">{errors.email.message}</p>
              )}
              {serverError && <p className="auth-form__error text-destructive">{serverError}</p>}
            </div>

            <div className="auth-form__actions">
              <Button type="submit" disabled={isSubmitting} className="auth-form__button">
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                ) : success ? (
                  'Resend Reset Link'
                ) : (
                  'Send Reset Link'
                )}
              </Button>
              <Link href="/login" className="auth-form__link hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
