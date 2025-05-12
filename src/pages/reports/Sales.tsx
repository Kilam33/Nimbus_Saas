import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import {
  BarChart as BarChartIcon,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useStore } from '../../context/StoreContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import Button from '../../components/ui/button';
import Input from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';

const Sales: React.FC = () => {
  const { currentStore } = useStore();
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  // Fetch sales data
  const { data: salesData, isLoading } = useQuery(
    ['sales', currentStore?.id, dateRange],
    async () => {
      const startDateTime = startOfDay(new Date(dateRange.start));
      const endDateTime = endOfDay(new Date(dateRange.end));

      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          cashier:cashier_id(email),
          sale_items(
            quantity,
            unit_price,
            subtotal,
            products(name)
          )
        `)
        .eq('store_id', currentStore?.id)
        .gte('created_at', startDateTime.toISOString())
        .lte('created_at', endDateTime.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    {
      enabled: !!currentStore?.id,
    }
  );

  // Calculate summary metrics
  const summary = React.useMemo(() => {
    if (!salesData) return {
      totalSales: 0,
      totalTransactions: 0,
      averageTransaction: 0,
      uniqueCustomers: 0,
    };

    const totalSales = salesData.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalTransactions = salesData.length;
    const averageTransaction = totalSales / totalTransactions || 0;
    const uniqueCustomers = new Set(salesData.map(sale => sale.cashier_id)).size;

    return {
      totalSales,
      totalTransactions,
      averageTransaction,
      uniqueCustomers,
    };
  }, [salesData]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (!salesData) return [];

    const salesByDate = salesData.reduce((acc: any, sale) => {
      const date = format(new Date(sale.created_at), 'MMM dd');
      if (!acc[date]) {
        acc[date] = {
          date,
          sales: 0,
          transactions: 0,
        };
      }
      acc[date].sales += sale.total_amount;
      acc[date].transactions += 1;
      return acc;
    }, {});

    return Object.values(salesByDate);
  }, [salesData]);

  // Export sales data
  const handleExport = () => {
    if (!salesData) return;

    const csvData = salesData.map(sale => ({
      'Date': format(new Date(sale.created_at), 'yyyy-MM-dd HH:mm:ss'),
      'Transaction ID': sale.id,
      'Cashier': sale.cashier.email,
      'Total Amount': sale.total_amount,
      'Tax Amount': sale.tax_amount,
      'Payment Method': sale.payment_method,
      'Status': sale.status,
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `sales-report-${dateRange.start}-to-${dateRange.end}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
          <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-gray-600">View and analyze your sales data</p>
        </div>
        <Button
          onClick={handleExport}
          leftIcon={<Download className="h-5 w-5" />}
          disabled={!salesData?.length}
        >
          Export Report
        </Button>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              leftIcon={<Calendar className="h-5 w-5 text-gray-400" />}
              className="w-full sm:w-auto"
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              leftIcon={<Calendar className="h-5 w-5 text-gray-400" />}
              className="w-full sm:w-auto"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {formatCurrency(summary.totalSales, currentStore?.currency)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-primary-100">
                <DollarSign className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Transactions</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {summary.totalTransactions}
                </p>
              </div>
              <div className="p-3 rounded-full bg-secondary-100">
                <BarChartIcon className="h-6 w-6 text-secondary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Sale</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {formatCurrency(summary.averageTransaction, currentStore?.currency)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-accent-100">
                <TrendingUp className="h-6 w-6 text-accent-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Unique Customers</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {summary.uniqueCustomers}
                </p>
              </div>
              <div className="p-3 rounded-full bg-success-100">
                <Users className="h-6 w-6 text-success-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => formatCurrency(value, currentStore?.currency)}
                />
                <Bar
                  dataKey="sales"
                  fill="#0ea5e9"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cashier
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesData?.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.cashier.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {sale.sale_items.length} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {formatCurrency(sale.total_amount, currentStore?.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sale.status === 'completed'
                            ? 'bg-success-100 text-success-800'
                            : sale.status === 'refunded'
                            ? 'bg-error-100 text-error-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!salesData || salesData.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No sales data found for the selected date range.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sales;