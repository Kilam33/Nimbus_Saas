import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>();
  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { error } = await signUp(data.email, data.password);
      if (error) throw error;
      
      toast.success('Registration successful', {
        description: 'Please continue to set up your store.'
      });
      navigate('/setup');
    } catch (error: any) {
      toast.error('Registration failed', { 
        description: error.message || 'Please try again with a different email'
      });
    }
  };

  return (
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
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
          error={errors.password?.message}
          {...register('password', { 
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters'
            }
          })}
        />
      </div>

      <div>
        <Input
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', { 
            required: 'Please confirm your password',
            validate: value => value === password || 'Passwords do not match'
          })}
        />
      </div>

      <div>
        <Button
          type="submit"
          className="w-full"
          isLoading={isSubmitting}
        >
          Sign up
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
};

export default Register;