// === INVITE ACCEPTANCE (FR-03: Tokenized email invite link activation) ===
// Validates invite token, then lets the user set a password and activate their account.

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { SmylsLogo } from '@/components/icons/SmylsLogo';
import { BRAND_GRADIENT } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AcceptInviteForm {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

function AcceptInviteContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const key = searchParams.get('key');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<AcceptInviteForm>({
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!key) {
        setTokenError('No invite token provided. Please check your invitation link.');
        setIsValidating(false);
        return;
      }

      try {
        const response = await apiClient.validateInviteToken(key);

        if (response.message.valid) {
          setUserEmail(response.message.email || null);
          // Pre-fill first name if available
          if (response.message.first_name) {
            setValue('firstName', response.message.first_name);
          }
        } else {
          setTokenError(('error' in response.message ? response.message.error : undefined) || 'Invalid or expired token');
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setTokenError('Failed to validate invitation. Please try again or request a new invite.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [key, setValue]);

  const onSubmit = async (data: AcceptInviteForm) => {
    setError(null);

    if (!key) {
      setError('Invalid invitation token');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.acceptInvite({
        key,
        password: data.password,
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim() || undefined
      });

      if (response.message.success) {
        setSuccess(true);
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login?message=Account activated successfully. Please sign in.');
        }, 2000);
      } else {
        setError(('error' in response.message ? response.message.error : undefined) || 'Failed to activate account');
      }
    } catch (err) {
      console.error('Accept invite error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate account. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-100">
        <Card className="w-full max-w-md bg-white rounded-lg shadow-sm border-0 p-10">
          <CardContent className="p-0">
            <div className="text-center space-y-4">
              <LoadingSpinner message="Validating your invitation..." />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Token error state
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-100">
        <Card className="w-full max-w-md bg-white rounded-lg shadow-sm border-0 p-10">
          <CardContent className="p-0">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-red-100">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Invalid Invitation
              </h3>
              <p className="text-muted-foreground">
                {tokenError}
              </p>
              <div className="pt-4">
                <Link href="/login">
                  <Button
                    className="w-full h-12 rounded-xl font-semibold text-xs"
                  >
                    Go to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-100">
        <Card className="w-full max-w-md bg-white rounded-lg shadow-sm border-0 p-10">
          <CardContent className="p-0">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{background: BRAND_GRADIENT}}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Account Activated!
              </h3>
              <p className="text-muted-foreground">
                Redirecting you to sign in...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-100">
      <div className="w-full max-w-md">
        {/* Form Header with SMYLS Logo and Title */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <SmylsLogo size={64} />
          <h1 className="text-2xl font-bold text-center">
            <span className="text-foreground/45">Welcome to</span>
            <span className="text-foreground"> SMYLS</span>
            <span className="text-primary">.</span>
          </h1>
          {userEmail && (
            <p className="text-sm text-muted-foreground">
              Setting up account for <strong>{userEmail}</strong>
            </p>
          )}
        </div>

        {/* Form Box */}
        <Card className="bg-white rounded-lg shadow-sm border-0 p-10">
          <CardContent className="p-0">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* First Name Field */}
                <div>
                  <Input
                    type="text"
                    placeholder="First Name"
                    disabled={isLoading}
                    className="h-12 px-4 rounded-xl border-2 border-zinc-300 text-sm"
                    aria-invalid={!!errors.firstName}
                    {...register('firstName', { required: 'First name is required' })}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name Field */}
                <div>
                  <Input
                    type="text"
                    placeholder="Last Name (optional)"
                    disabled={isLoading}
                    className="h-12 px-4 rounded-xl border-2 border-zinc-300 text-sm"
                    aria-invalid={!!errors.lastName}
                    {...register('lastName')}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create Password (min. 8 characters)"
                      disabled={isLoading}
                      className="h-12 px-4 pr-12 rounded-xl border-2 border-zinc-300 text-sm"
                      aria-invalid={!!errors.password}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' }
                      })}
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
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      disabled={isLoading}
                      className="h-12 px-4 pr-12 rounded-xl border-2 border-zinc-300 text-sm"
                      aria-invalid={!!errors.confirmPassword}
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) =>
                          value === watch('password') || 'Passwords do not match'
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Activate Account Button */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-semibold text-xs"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Activating Account...
                  </>
                ) : (
                  'Activate Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium text-link hover:underline"
                >
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

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-100">
        <LoadingSpinner message="Loading..." />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
