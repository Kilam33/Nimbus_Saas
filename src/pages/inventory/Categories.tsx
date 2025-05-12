import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Tag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import CategoryModal from '../../components/inventory/CategoryModal';

interface Category {
  id: string;
  name: string;
  product_count?: number;
}

const Categories: React.FC = () => {
  const { currentStore } = useStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Fetch categories with product count
  const { data: categories, isLoading } = useQuery(
    ['categories', currentStore?.id],
    async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select(`
          *,
          products (count)
        `)
        .eq('store_id', currentStore?.id)
        .order('name');

      if (error) throw error;

      return data.map((category: any) => ({
        ...category,
        product_count: category.products[0].count,
      }));
    },
    {
      enabled: !!currentStore?.id,
    }
  );

  // Filter categories based on search term
  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Delete category mutation
  const deleteCategoryMutation = useMutation(
    async (categoryId: string) => {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['categories', currentStore?.id]);
        toast.success('Category deleted successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to delete category', {
          description: error.message
        });
      },
    }
  );

  const handleDeleteCategory = async (category: Category) => {
    if (category.product_count && category.product_count > 0) {
      toast.error('Cannot delete category', {
        description: 'This category has products assigned to it'
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this category?')) {
      await deleteCategoryMutation.mutateAsync(category.id);
    }
  };

  const handleCloseModal = () => {
    setShowCategoryModal(false);
    setSelectedCategory(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage your product categories</p>
        </div>
        <Button
          onClick={() => {
            setSelectedCategory(null);
            setShowCategoryModal(true);
          }}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Category List</CardTitle>
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-5 w-5 text-gray-400" />}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories?.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <Tag className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {category.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {category.product_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCategory(category);
                            setShowCategoryModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category)}
                        >
                          <Trash2 className="h-4 w-4 text-error-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCategories?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No categories found. Try a different search term or add a new category.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showCategoryModal && (
        <CategoryModal
          category={selectedCategory}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Categories;