import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Building2, DollarSign, Percent, Upload, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';

interface StoreSettingsFormData {
  name: string;
  currency: string;
  taxRate: number;
  logo?: FileList;
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

const StoreSettings: React.FC = () => {
  const { currentStore, updateStore } = useStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StoreSettingsFormData>({
    defaultValues: {
      name: currentStore?.name || '',
      currency: currentStore?.currency || 'USD',
      taxRate: currentStore?.tax_rate || 0,
    }
  });

  const handleLogoUpload = async (file: File) => {
    try {
      if (!currentStore) return null;

      const fileExt = file.name.split('.').pop();
      const fileName = `${currentStore.id}-logo.${fileExt}`;
      const filePath = `store-logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('public')
        .upload(filePath, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      throw error;
    }
  };

  const handleLogoDelete = async () => {
    try {
      if (!currentStore?.logo_url) return;

      // Extract file path from URL
      const urlParts = currentStore.logo_url.split('/');
      const filePath = urlParts.slice(-2).join('/');

      // Delete from storage
      const { error } = await supabase.storage
        .from('public')
        .remove([filePath]);

      if (error) throw error;

      // Update store record
      await updateStore(currentStore.id, {
        logo_url: null,
      });

      toast.success('Logo removed successfully');
    } catch (error: any) {
      toast.error('Failed to remove logo', {
        description: error.message
      });
    }
  };

  const onSubmit = async (data: StoreSettingsFormData) => {
    try {
      if (!currentStore) return;

      let logoUrl = currentStore.logo_url;

      // Handle logo upload if provided
      if (data.logo?.[0]) {
        logoUrl = await handleLogoUpload(data.logo[0]);
      }

      await updateStore(currentStore.id, {
        name: data.name,
        currency: data.currency,
        tax_rate: data.taxRate,
        logo_url: logoUrl,
      });

      toast.success('Store settings updated successfully');
    } catch (error: any) {
      toast.error('Failed to update store settings', {
        description: error.message
      });
    }
  };

  if (!currentStore) {
    return (
      <div className="text-center py-8 text-gray-500">
        No store selected.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-gray-600">Manage your store's configuration</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your store's basic details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            />

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
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store Logo</CardTitle>
            <CardDescription>
              Upload your store's logo image
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentStore.logo_url && (
                <div className="flex items-center space-x-4">
                  <img
                    src={currentStore.logo_url}
                    alt="Store Logo"
                    className="h-20 w-20 object-contain rounded-lg bg-gray-50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleLogoDelete}
                    leftIcon={<Trash2 className="h-5 w-5" />}
                  >
                    Remove Logo
                  </Button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload New Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  {...register('logo')}
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Choose File
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Recommended size: 512x512px. PNG or JPG only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            isLoading={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StoreSettings;