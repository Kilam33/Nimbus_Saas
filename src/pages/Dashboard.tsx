import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Users, Banknote, AlertCircle, TrendingUp } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import Button from '../components/ui/button';

const Dashboard: React.FC = () => {
  const { currentStore } = useStore();

  // This would normally fetch real data from the API
  const stats = {
    sales: { today: 1234.56, week: 8765.43 },
    products: { total: 124, lowStock: 12 },
    customers: 45,
  };

  // Quick action cards
  const quickActions = [
    {
      title: 'New Sale',
      description: 'Create a new point of sale transaction',
      icon: ShoppingCart,
      link: '/pos',
      color: 'bg-primary-100 text-primary-700',
    },
    {
      title: 'Add Product',
      description: 'Add a new product to your inventory',
      icon: Package,
      link: '/inventory/products',
      color: 'bg-secondary-100 text-secondary-700',
    },
    {
      title: 'View Reports',
      description: 'View sales and inventory reports',
      icon: TrendingUp,
      link: '/reports/sales',
      color: 'bg-accent-100 text-accent-700',
    },
  ];

  // Cards displaying key metrics
  const metricCards = [
    {
      title: 'Today\'s Sales',
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: currentStore?.currency || 'USD' }).format(stats.sales.today),
      description: 'Total sales for today',
      icon: Banknote,
      color: 'text-success-500',
    },
    {
      title: 'Products',
      value: stats.products.total,
      description: `${stats.products.lowStock} low stock items`,
      icon: Package,
      color: 'text-primary-500',
      alert: stats.products.lowStock > 0,
    },
    {
      title: 'Weekly Sales',
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: currentStore?.currency || 'USD' }).format(stats.sales.week),
      description: 'Total sales this week',
      icon: TrendingUp,
      color: 'text-secondary-500',
    },
  ];

  return (
    <div className="py-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to {currentStore?.name || 'your store'}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            as={Link}
            to="/pos"
            leftIcon={<ShoppingCart className="h-5 w-5" />}
          >
            New Sale
          </Button>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {metricCards.map((card, index) => (
          <Card key={index} variant="elevated" className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.color.includes('bg-') ? card.color : 'bg-gray-100'}`}>
                  <card.icon className={`h-6 w-6 ${!card.color.includes('bg-') ? card.color : ''}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {card.alert && <AlertCircle className="h-4 w-4 text-warning-500 mr-1" />}
                <p className="text-sm text-gray-500">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Section */}
      <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {quickActions.map((action, index) => (
          <Link key={index} to={action.link} className="block">
            <Card className="transition-all hover:shadow-md hover:translate-y-[-2px]">
              <CardContent className="p-6 flex items-start space-x-4">
                <div className={`p-3 rounded-full ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{action.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{action.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity Section (placeholder) */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-4">
            <div className="text-center py-8 text-gray-500">
              <p>Activity will appear here as you use the system</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;