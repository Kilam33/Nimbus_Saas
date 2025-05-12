import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../lib/supabase';
import { generateSKU } from '../../lib/utils';
import Button from '../ui/button';
import Input from '../ui/input';

interface ProductModalProps {
  product?: any;
  categories: any[];
  onClose: () => void;
}

interface ProductFormData {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price: number;
  cost_price?: number;
  current_stock: number;
  category_id?: string;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, categories, onClose }) => {
  const { currentStore } = useStore();
  const queryClient = useQueryClient();
  const isEditing = !!product;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    defaultValues: {
      name: product?.name || '',
      sku: product?.sku || '',
      barcode: product?.barcode || '',
      description: product?.description || '',
      price: product?.price || 0,
      cost_price: product?.cost_price || 0,
      current_stock: product?.current_stock || 0,
      category_id: product?.category_id || '',
    },
  });

  const mutation = useMutation(
    async (data: ProductFormData) => {
      if (!currentStore) throw new Error('No store selected');

      const productData = {
        ...data,
        store_id: currentStore.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
      } else {
        if (!data.sku) {
          productData.sku = generateSKU(data.name);
        }

        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products', currentStore?.id]);
        toast.success(
          isEditing ? 'Product updated successfully' : 'Product created successfully'
        );
        onClose();
      },
      onError: (error: any) => {
        toast.error(
          isEditing ? 'Failed to update product' : 'Failed to create product',
          { description: error.message }
        );
      },
    }
  );

  const onSubmit = async (data: ProductFormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Product' : 'New Product'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              error={errors.name?.message}
              {...register('name', { required: 'Product name is required' })}
            />

            <Input
              label="SKU"
              helperText="Leave blank to auto-generate"
              error={errors.sku?.message}
              {...register('sku')}
            />

            <Input
              label="Barcode"
              error={errors.barcode?.message}
              {...register('barcode')}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                {...register('category_id')}
              >
                <option value="">No Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="number"
              label="Price"
              step="0.01"
              error={errors.price?.message}
              {...register('price', {
                required: 'Price is required',
                min: { value: 0, message: 'Price cannot be negative' },
                valueAsNumber: true,
              })}
            />

            <Input
              type="number"
              label="Cost Price"
              step="0.01"
              error={errors.cost_price?.message}
              {...register('cost_price', {
                min: { value: 0, message: 'Cost price cannot be negative' },
                valueAsNumber: true,
              })}
            />

            <Input
              type="number"
              label="Current Stock"
              error={errors.current_stock?.message}
              {...register('current_stock', {
                required: 'Stock quantity is required',
                min: { value: 0, message: 'Stock cannot be negative' },
                valueAsNumber: true,
              })}
            />
          </div>

          <div>
            <Input
              label="Description"
              error={errors.description?.message}
              {...register('description')}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              {isEditing ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;