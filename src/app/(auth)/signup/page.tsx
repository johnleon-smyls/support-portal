// === SIGNUP PAGE (FR-01: User registration, NFR-04: Client-side input validation) ===

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { SignUpData } from '@/types/frappe';
import { SmylsLogo } from '@/components/icons/SmylsLogo';
import { BRAND_PRIMARY, BRAND_GRADIENT, FONT_FAMILY } from '@/lib/theme';
import { validatePassword } from '@/lib/validation';
import { GradientButton } from '@/components/ui/gradient-button';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const passwordError = validatePassword(formData.password, formData.confirmPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      const signUpData: SignUpData = {
        email: formData.email,
        full_name: formData.fullName,
        password: formData.password,
        user_type: 'Website User'
      };

      await apiClient.signUp(signUpData);

      // Assign Support Portal User role
      try {
        await apiClient.assignRole(formData.email, 'Support Portal User');
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{background: '#F3F4F6'}}>
        <Card className="w-full max-w-md bg-white rounded-lg shadow-sm border-0" style={{padding: '40px 20px'}}>
          <CardContent className="p-0">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{background: BRAND_GRADIENT}}>
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold" style={{color: '#000', fontFamily: FONT_FAMILY}}>
                Account Created Successfully!
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background: '#F3F4F6'}}>
      <div className="w-full max-w-md">
        {/* Form Header with SMYLS Logo and Title */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <SmylsLogo size={64} />
          <h1 className="text-2xl font-bold text-center" style={{fontFamily: 'Helvetica Neue, -apple-system, Roboto, Helvetica, sans-serif'}}>
            <span style={{color: 'rgba(0,0,0,0.45)'}}>Join</span>
            <span style={{color: 'rgba(0,0,0,1)'}}> SMYLS</span>
            <span style={{color: BRAND_PRIMARY}}>.</span>
          </h1>
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
                {/* Full Name Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Full Name"
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

                {/* Email Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email Address"
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

              {/* Create Account Button */}
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
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
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
