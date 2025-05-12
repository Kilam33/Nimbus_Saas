import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'sonner';

// Context providers
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// App pages
import Dashboard from './pages/Dashboard';
import Products from './pages/inventory/Products';
import Categories from './pages/inventory/Categories';
import POS from './pages/pos/POS';
import Sales from './pages/reports/Sales';
import StoreSettings from './pages/settings/StoreSettings';
import UserManagement from './pages/settings/UserManagement';

// Auth route wrapper
import ProtectedRoute from './components/auth/ProtectedRoute';
import StoreSetup from './pages/onboarding/StoreSetup';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          <Router>
            <Routes>
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>

              {/* Onboarding */}
              <Route 
                path="/setup" 
                element={
                  <ProtectedRoute>
                    <StoreSetup />
                  </ProtectedRoute>
                } 
              />

              {/* App routes */}
              <Route 
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/inventory/products" element={<Products />} />
                <Route path="/inventory/categories" element={<Categories />} />
                <Route path="/reports/sales" element={<Sales />} />
                <Route path="/settings/store" element={<StoreSettings />} />
                <Route path="/settings/users" element={<UserManagement />} />
              </Route>

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
          
          <Toaster 
            position="top-right" 
            closeButton
            richColors
          />
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;