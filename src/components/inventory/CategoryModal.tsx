import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../lib/supabase';
import Button from '../ui/button';
import Input from '../ui/input';

interface CategoryModalProps {
  category?: any;
  onClose: () => void;
}

interface CategoryFormData {
  name: string;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, onClose }) => {
  const { currentStore } = useStore();
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CategoryFormData>({
    defaultValues: {
      name: category?.name || '',
    },
  });

  const mutation = useMutation(
    async (data: CategoryFormData) => {
      if (!currentStore) throw new Error('No store selected');

      const categoryData = {
        ...data,
        store_id: currentStore.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('product_categories')
          .update(categoryData)
          .eq('id', category.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('product_categories')
          .insert([categoryData]);

        if (error) throw error;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['categories', currentStore?.id]);
        toast.success(
          isEditing ? 'Category updated successfully' : 'Category created successfully'
        );
        onClose();
      },
      onError: (error: any) => {
        toast.error(
          isEditing ? 'Failed to update category' : 'Failed to create category',
          { description: error.message }
        );
      },
    }
  );

  const onSubmit = async (data: CategoryFormData) => {
    await mutation.mutateAsync(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Category' : 'New Category'}
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
          <Input
            label="Category Name"
            error={errors.name?.message}
            {...register('name', { required: 'Category name is required' })}
          />

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
              {isEditing ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;