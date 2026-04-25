// === SIGNUP PAGE (FR-01: User registration, NFR-04: Client-side input validation) ===

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { SignUpData } from '@/types/frappe';
import { SmylsLogo } from '@/components/icons/SmylsLogo';
import { BRAND_GRADIENT } from '@/lib/theme';
import { Button } from '@/components/ui/button';

interface SignUpForm {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignUpForm>();

  const onSubmit = async (data: SignUpForm) => {
    setError(null);

    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const signUpData: SignUpData = {
        email: data.email,
        full_name: data.fullName,
        password: data.password,
        user_type: 'Website User'
      };

      await apiClient.signUp(signUpData);

      // Assign Support Portal User role
      try {
        await apiClient.assignRole(data.email, 'Support Portal User');
      } catch (roleError) {
        console.warn('Could not assign role automatically:', roleError);
      }

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login?message=Account created successfully. Please sign in.');
      }, 2000);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account. Please try again.';
      setError(errorMessage);
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
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{background: BRAND_GRADIENT}}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Account Created Successfully!
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-100">
      <div className="w-full max-w-md">
        {/* Form Header with SMYLS Logo and Title */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <SmylsLogo size={64} />
          <h1 className="text-2xl font-bold text-center">
            <span className="text-foreground/45">Join</span>
            <span className="text-foreground"> SMYLS</span>
            <span className="text-primary">.</span>
          </h1>
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
                {/* Full Name Field */}
                <div>
                  <Input
                    type="text"
                    placeholder="Full Name"
                    disabled={isLoading}
                    className="h-12 px-4 rounded-xl border-2 border-zinc-300 text-sm"
                    aria-invalid={!!errors.fullName}
                    {...register('fullName', { required: 'Full name is required' })}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email Field */}
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

              {/* Create Account Button */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-semibold text-xs"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
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
