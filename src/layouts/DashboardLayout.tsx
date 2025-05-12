import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  CloudLightning, 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3,
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import Button from '../components/ui/button';

const DashboardLayout: React.FC = () => {
  const { signOut, user } = useAuth();
  const { currentStore, userStores, setCurrentStore } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Point of Sale', href: '/pos', icon: ShoppingCart },
    { 
      name: 'Inventory',
      icon: Package,
      children: [
        { name: 'Products', href: '/inventory/products' },
        { name: 'Categories', href: '/inventory/categories' },
      ],
    },
    { 
      name: 'Reports',
      icon: BarChart3,
      children: [
        { name: 'Sales', href: '/reports/sales' },
      ],
    },
    { 
      name: 'Settings',
      icon: Settings,
      children: [
        { name: 'Store', href: '/settings/store' },
        { name: 'Users', href: '/settings/users' },
      ],
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const renderNavItem = (item: any, index: number) => {
    if (item.children) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            className="group w-full flex items-center pl-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            onClick={() => {
              const el = document.getElementById(`${item.name}-dropdown`);
              if (el) {
                el.classList.toggle('hidden');
              }
            }}
          >
            <item.icon className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-500" />
            <span className="flex-1">{item.name}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          <div id={`${item.name}-dropdown`} className="hidden pl-8 space-y-1">
            {item.children.map((child: any) => (
              <NavLink
                key={child.name}
                to={child.href}
                className={({ isActive }) =>
                  isActive
                    ? 'bg-gray-100 text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                }
              >
                {child.name}
              </NavLink>
            ))}
          </div>
        </div>
      );
    }

    return (
      <NavLink
        key={item.name}
        to={item.href}
        className={({ isActive }) =>
          isActive
            ? 'bg-gray-100 text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md'
        }
      >
        <item.icon className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-500" />
        {item.name}
      </NavLink>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <CloudLightning className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">NIMBUS</span>
              </div>
              <div className="mt-5 px-2">
                <div className="relative">
                  <button
                    onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-900"
                  >
                    <span className="truncate">{currentStore?.name || 'Select Store'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {isStoreDropdownOpen && (
                    <div className="origin-top-left absolute left-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="py-1">
                        {userStores.map((store) => (
                          <button
                            key={store.id}
                            onClick={() => {
                              setCurrentStore(store);
                              setIsStoreDropdownOpen(false);
                            }}
                            className={`${
                              currentStore?.id === store.id
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-700'
                            } block w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                          >
                            {store.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navigation.map(renderNavItem)}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {user?.email}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    aria-label="Sign out"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } fixed inset-0 flex z-40 md:hidden`}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          aria-hidden="true"
          onClick={toggleMobileMenu}
        ></div>

        <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-shrink-0 flex items-center px-4">
            <CloudLightning className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">NIMBUS</span>
          </div>
          <div className="mt-5 px-2">
            <div className="relative">
              <button
                onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-900"
              >
                <span className="truncate">{currentStore?.name || 'Select Store'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {isStoreDropdownOpen && (
                <div className="origin-top-left absolute left-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1">
                    {userStores.map((store) => (
                      <button
                        key={store.id}
                        onClick={() => {
                          setCurrentStore(store);
                          setIsStoreDropdownOpen(false);
                        }}
                        className={`${
                          currentStore?.id === store.id
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700'
                        } block w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                      >
                        {store.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-5 flex-1 h-0 overflow-y-auto">
            <nav className="px-2 space-y-1">
              {navigation.map(renderNavItem)}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {user?.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow md:hidden">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={toggleMobileMenu}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex items-center justify-between">
            <div className="flex items-center">
              <CloudLightning className="h-6 w-6 text-primary-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">NIMBUS</span>
            </div>
          </div>
        </div>

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;