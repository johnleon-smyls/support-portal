'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { SmylsLogo } from '@/components/icons/SmylsLogo';
import { BRAND_GRADIENT } from '@/lib/theme';
import { Button } from '@/components/ui/button';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError(null);
    setIsLoading(true);

    try {
      await apiClient.resetPassword(data.email);
      setSuccess(true);
    } catch (err: unknown) {
      // Always show success to avoid leaking which emails exist
      setSuccess(true);
      console.warn('Password reset request failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-100">
        <Card className="w-full max-w-md bg-white rounded-lg shadow-sm border-0 p-10">
          <CardContent className="p-0">
            <div className="text-center space-y-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: BRAND_GRADIENT }}
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Check Your Email
              </h3>
              <p className="text-muted-foreground">
                If an account exists for <strong>{getValues('email')}</strong>, we&apos;ve sent a link to reset your password.
              </p>
              <Link href="/login">
                <Button
                  className="w-full h-12 rounded-xl font-semibold text-xs mt-4"
                >
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-100">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <SmylsLogo size={64} />
          <h1 className="text-2xl font-bold text-center">
            <span className="text-foreground/45">Reset your</span>
            <span className="text-foreground"> Password</span>
            <span className="text-primary">.</span>
          </h1>
        </div>

        {/* Form */}
        <Card className="bg-white rounded-lg shadow-sm border-0 p-10">
          <CardContent className="p-0">
            <p className="text-sm text-center mb-6 text-muted-foreground">
              Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Input
                  type="email"
                  placeholder="Email Address"
                  disabled={isLoading}
                  className="h-12 px-4 rounded-xl border-2 border-zinc-300 text-sm"
                  aria-invalid={!!errors.email}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-semibold text-xs"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link href="/login" className="font-medium text-link hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
