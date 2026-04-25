// === INVITE ACCEPTANCE (FR-03: Tokenized email invite link activation) ===
// Validates invite token, then lets the user set a password and activate their account.

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { SmylsLogo } from '@/components/icons/SmylsLogo';
import { BRAND_PRIMARY, BRAND_GRADIENT, FONT_FAMILY } from '@/lib/theme';
import { validatePassword } from '@/lib/validation';
import { GradientButton } from '@/components/ui/gradient-button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

function AcceptInviteContent() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  });
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
            setFormData(prev => ({ ...prev, firstName: response.message.first_name || '' }));
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
  }, [key]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }

    const passwordError = validatePassword(formData.password, formData.confirmPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (!key) {
      setError('Invalid invitation token');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.acceptInvite({
        key,
        password: formData.password,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim() || undefined
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{background: '#F3F4F6'}}>
        <Card className="w-full max-w-md bg-white rounded-lg shadow-sm border-0" style={{padding: '40px 20px'}}>
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{background: '#F3F4F6'}}>
        <Card className="w-full max-w-md bg-white rounded-lg shadow-sm border-0" style={{padding: '40px 20px'}}>
          <CardContent className="p-0">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-red-100">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold" style={{color: '#000', fontFamily: FONT_FAMILY}}>
                Invalid Invitation
              </h3>
              <p style={{color: '#6B7280', fontFamily: FONT_FAMILY}}>
                {tokenError}
              </p>
              <div className="pt-4">
                <Link href="/login">
                  <GradientButton
                    className="w-full h-12 rounded-xl font-semibold"
                    style={{
                      fontSize: '12px',
                      fontFamily: FONT_FAMILY
                    }}
                  >
                    Go to Sign In
                  </GradientButton>
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{background: '#F3F4F6'}}>
        <Card className="w-full max-w-md bg-white rounded-lg shadow-sm border-0" style={{padding: '40px 20px'}}>
          <CardContent className="p-0">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{background: BRAND_GRADIENT}}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold" style={{color: '#000', fontFamily: FONT_FAMILY}}>
                Account Activated!
              </h3>
              <p style={{color: '#6B7280', fontFamily: FONT_FAMILY}}>
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{background: '#F3F4F6'}}>
      <div className="w-full max-w-md">
        {/* Form Header with SMYLS Logo and Title */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <SmylsLogo size={64} />
          <h1 className="text-2xl font-bold text-center" style={{fontFamily: 'Helvetica Neue, -apple-system, Roboto, Helvetica, sans-serif'}}>
            <span style={{color: 'rgba(0,0,0,0.45)'}}>Welcome to</span>
            <span style={{color: 'rgba(0,0,0,1)'}}> SMYLS</span>
            <span style={{color: BRAND_PRIMARY}}>.</span>
          </h1>
          {userEmail && (
            <p className="text-sm" style={{color: '#6B7280', fontFamily: FONT_FAMILY}}>
              Setting up account for <strong>{userEmail}</strong>
            </p>
          )}
        </div>

        {/* Form Box */}
        <Card className="bg-white rounded-lg shadow-sm border-0" style={{padding: '40px 20px'}}>
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                {/* First Name Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First Name"
                      required
                      disabled={isLoading}
                      className="h-12 px-4 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      style={{
                        borderColor: '#C5C6CC',
                        fontSize: '14px',
                        fontFamily: FONT_FAMILY
                      }}
                    />
                  </div>
                </div>

                {/* Last Name Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last Name (optional)"
                      disabled={isLoading}
                      className="h-12 px-4 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      style={{
                        borderColor: '#C5C6CC',
                        fontSize: '14px',
                        fontFamily: FONT_FAMILY
                      }}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create Password (min. 8 characters)"
                      required
                      disabled={isLoading}
                      minLength={8}
                      className="h-12 px-4 pr-12 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      style={{
                        borderColor: '#C5C6CC',
                        fontSize: '14px',
                        fontFamily: FONT_FAMILY
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm Password"
                      required
                      disabled={isLoading}
                      minLength={8}
                      className="h-12 px-4 pr-12 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      style={{
                        borderColor: '#C5C6CC',
                        fontSize: '14px',
                        fontFamily: FONT_FAMILY
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Activate Account Button */}
              <GradientButton
                type="submit"
                className="w-full h-12 rounded-xl font-semibold"
                style={{
                  fontSize: '12px',
                  fontFamily: FONT_FAMILY
                }}
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
              </GradientButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm" style={{color: '#6B7280', fontFamily: FONT_FAMILY}}>
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-medium hover:underline"
                  style={{color: BRAND_PRIMARY}}
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{background: '#F3F4F6'}}>
        <LoadingSpinner message="Loading..." />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
