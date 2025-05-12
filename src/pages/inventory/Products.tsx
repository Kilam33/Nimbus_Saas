import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'sonner';
import { Plus, Search, Tag, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import ProductModal from '../../components/inventory/ProductModal';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  price: number;
  cost_price: number | null;
  current_stock: number;
  image_url: string | null;
  category_id: string | null;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
}

const Products: React.FC = () => {
  const { currentStore } = useStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch products
  const { data: products, isLoading } = useQuery(
    ['products', currentStore?.id],
    async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_categories(name)')
        .eq('store_id', currentStore?.id)
        .order('name');

      if (error) throw error;
      return data;
    },
    {
      enabled: !!currentStore?.id,
    }
  );

  // Fetch categories for dropdown
  const { data: categories } = useQuery(
    ['categories', currentStore?.id],
    async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('store_id', currentStore?.id)
        .order('name');

      if (error) throw error;
      return data;
    },
    {
      enabled: !!currentStore?.id,
    }
  );

  // Filter products based on search term
  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  // Delete product mutation
  const deleteProductMutation = useMutation(
    async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products', currentStore?.id]);
        toast.success('Product deleted successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to delete product', {
          description: error.message
        });
      },
    }
  );

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProductMutation.mutateAsync(productId);
    }
  };

  const handleCloseModal = () => {
    setShowProductModal(false);
    setSelectedProduct(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your store's products</p>
        </div>
        <Button
          onClick={() => {
            setSelectedProduct(null);
            setShowProductModal(true);
          }}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Product List</CardTitle>
            <Input
              placeholder="Search products..."
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
                    Product
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU/Barcode
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts?.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {product.image_url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={product.image_url}
                              alt={product.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <Tag className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          {product.description && (
                            <div className="text-sm text-gray-500">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.sku}</div>
                      {product.barcode && (
                        <div className="text-sm text-gray-500">
                          {product.barcode}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(product.price, currentStore?.currency)}
                      </div>
                      {product.cost_price && (
                        <div className="text-sm text-gray-500">
                          Cost: {formatCurrency(product.cost_price, currentStore?.currency)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.current_stock <= 0
                              ? 'bg-error-100 text-error-800'
                              : product.current_stock <= 10
                              ? 'bg-warning-100 text-warning-800'
                              : 'bg-success-100 text-success-800'
                          }`}
                        >
                          {product.current_stock}
                        </span>
                        {product.current_stock <= 10 && (
                          <AlertCircle className="ml-1 h-4 w-4 text-warning-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowProductModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-error-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProducts?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No products found. Try a different search term or add a new product.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showProductModal && (
        <ProductModal
          product={selectedProduct}
          categories={categories || []}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Products;