import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: window.location.origin + '/login',
      });
      
      if (error) throw error;
      
      setIsSubmitted(true);
      toast.success('Reset link sent', { 
        description: 'Check your email for password reset instructions'
      });
    } catch (error: any) {
      toast.error('Failed to send reset email', { 
        description: error.message || 'Please try again'
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <Mail className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900">Check your email</h3>
        <p className="mt-1 text-sm text-gray-500">
          We've sent a password reset link to your email address.
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center text-primary-600 hover:text-primary-500"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Reset your password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
            error={errors.email?.message}
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: 'Please enter a valid email'
              }
            })}
          />
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            isLoading={isSubmitting}
          >
            Send reset link
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </>
  );
};

export default ForgotPassword;