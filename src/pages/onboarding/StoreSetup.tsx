import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, DollarSign, Percent } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';

interface StoreSetupFormData {
  name: string;
  currency: string;
  taxRate: number;
}

const currencies = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'BRL', label: 'Brazilian Real (R$)' },
];

const StoreSetup: React.FC = () => {
  const navigate = useNavigate();
  const { createStore } = useStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StoreSetupFormData>({
    defaultValues: {
      currency: 'USD',
      taxRate: 0,
    }
  });

  const onSubmit = async (data: StoreSetupFormData) => {
    try {
      const { store, error } = await createStore({
        name: data.name,
        currency: data.currency,
        tax_rate: data.taxRate,
        logo_url: null,
      });
      
      if (error) throw error;
      
      toast.success('Store created successfully');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error('Failed to create store', { 
        description: error.message || 'Please try again'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Set up your store
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Let's get your store ready for business
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card variant="elevated">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Input
                  label="Store Name"
                  leftIcon={<Building2 className="h-5 w-5 text-gray-400" />}
                  error={errors.name?.message}
                  {...register('name', { 
                    required: 'Store name is required',
                    minLength: {
                      value: 2,
                      message: 'Store name must be at least 2 characters'
                    }
                  })}
                  placeholder="Corner Store"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    {...register('currency', { required: 'Currency is required' })}
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.currency && (
                  <p className="mt-1 text-sm text-error-500">{errors.currency.message}</p>
                )}
              </div>

              <div>
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  leftIcon={<Percent className="h-5 w-5 text-gray-400" />}
                  error={errors.taxRate?.message}
                  {...register('taxRate', { 
                    required: 'Tax rate is required',
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: 'Tax rate cannot be negative'
                    },
                    max: {
                      value: 100,
                      message: 'Tax rate cannot exceed 100%'
                    }
                  })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  Create Store
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StoreSetup;