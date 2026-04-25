'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { SmylsLogo } from '@/components/icons/SmylsLogo';
import { BRAND_PRIMARY, BRAND_GRADIENT, FONT_FAMILY } from '@/lib/theme';
import { GradientButton } from '@/components/ui/gradient-button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.resetPassword(email);
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F3F4F6' }}>
        <Card className="w-full max-w-md bg-white rounded-lg shadow-sm border-0" style={{ padding: '40px 20px' }}>
          <CardContent className="p-0">
            <div className="text-center space-y-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: BRAND_GRADIENT }}
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3
                className="text-lg font-semibold"
                style={{ color: '#000', fontFamily: FONT_FAMILY }}
              >
                Check Your Email
              </h3>
              <p style={{ color: '#6B7280', fontFamily: FONT_FAMILY }}>
                If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password.
              </p>
              <Link href="/login">
                <GradientButton
                  className="w-full h-12 rounded-xl font-semibold mt-4"
                  style={{
                    fontSize: '12px',
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  Back to Login
                </GradientButton>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F3F4F6' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <SmylsLogo size={64} />
          <h1
            className="text-2xl font-bold text-center"
            style={{ fontFamily: 'Helvetica Neue, -apple-system, Roboto, Helvetica, sans-serif' }}
          >
            <span style={{ color: 'rgba(0,0,0,0.45)' }}>Reset your</span>
            <span style={{ color: 'rgba(0,0,0,1)' }}> Password</span>
            <span style={{ color: BRAND_PRIMARY }}>.</span>
          </h1>
        </div>

        {/* Form */}
        <Card className="bg-white rounded-lg shadow-sm border-0" style={{ padding: '40px 20px' }}>
          <CardContent className="p-0">
            <p
              className="text-sm text-center mb-6"
              style={{ color: '#6B7280', fontFamily: FONT_FAMILY }}
            >
              Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Email Address"
                    required
                    disabled={isLoading}
                    className="h-12 px-4 rounded-xl border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{
                      borderColor: '#C5C6CC',
                      fontSize: '14px',
                      fontFamily: FONT_FAMILY,
                    }}
                  />
                </div>
              </div>

              <GradientButton
                type="submit"
                className="w-full h-12 rounded-xl font-semibold"
                style={{
                  fontSize: '12px',
                  fontFamily: FONT_FAMILY,
                }}
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
              </GradientButton>
            </form>

            <div className="mt-6 text-center">
              <p
                className="text-sm"
                style={{ color: '#6B7280', fontFamily: FONT_FAMILY }}
              >
                Remember your password?{' '}
                <Link href="/login" className="font-medium hover:underline" style={{ color: BRAND_PRIMARY }}>
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
