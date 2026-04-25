// === LOGIN PAGE (FR-02: Email/password login via Frappe authentication) ===

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { SmylsLogo } from '@/components/icons/SmylsLogo';
import { BRAND_PRIMARY, FONT_FAMILY } from '@/lib/theme';
import { GradientButton } from '@/components/ui/gradient-button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login({ usr: email, pwd: password });
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      // Error is already set in the auth store, no need to set it again here
      // The error will be displayed via the {error && ...} block in the JSX
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background: '#F3F4F6'}}>
      <div className="w-full max-w-md">
        {/* Form Header with SMYLS Logo and Title */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <SmylsLogo size={64} />
          <h1 className="text-2xl font-bold text-center" style={{fontFamily: 'Helvetica Neue, -apple-system, Roboto, Helvetica, sans-serif'}}>
            <span style={{color: 'rgba(0,0,0,0.45)'}}>Login to</span>
            <span style={{color: 'rgba(0,0,0,1)'}}> SMYLS Support</span>
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
                {/* Email Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      disabled={isLoading}
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

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold hover:underline"
                      style={{color: '#006FFD', fontFamily: FONT_FAMILY}}
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
              </div>

              {/* Login Button */}
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
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </GradientButton>
            </form>

            {/* Signup hidden — users are onboarded via invite only */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
