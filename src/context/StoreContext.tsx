import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Database } from '../lib/database.types';

type Store = Database['public']['Tables']['stores']['Row'];
type StoreMember = Database['public']['Tables']['store_members']['Row'];

interface StoreContextType {
  currentStore: Store | null;
  userStores: Store[];
  userRole: string | null;
  loading: boolean;
  error: string | null;
  setCurrentStore: (store: Store) => void;
  createStore: (storeData: Omit<Store, 'id' | 'created_at' | 'owner_id'>) => Promise<{ store: Store | null, error: any | null }>;
  updateStore: (id: string, storeData: Partial<Store>) => Promise<{ error: any | null }>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [userStores, setUserStores] = useState<Store[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stores user has access to
  useEffect(() => {
    async function fetchUserStores() {
      if (!user) {
        setUserStores([]);
        setCurrentStore(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get stores where user is a member
        const { data: membershipData, error: membershipError } = await supabase
          .from('store_members')
          .select(`
            store_id,
            role,
            stores:store_id (*)
          `)
          .eq('user_id', user.id);

        if (membershipError) throw membershipError;

        // Get stores user owns
        const { data: ownedStoresData, error: ownedStoresError } = await supabase
          .from('stores')
          .select()
          .eq('owner_id', user.id);

        if (ownedStoresError) throw ownedStoresError;

        // Combine and deduplicate stores
        const memberStores = membershipData.map(item => item.stores as Store);
        const allStores = [...memberStores, ...ownedStoresData];
        const uniqueStoresMap = new Map<string, Store>();
        
        allStores.forEach(store => {
          if (store) uniqueStoresMap.set(store.id, store);
        });
        
        const stores = Array.from(uniqueStoresMap.values());
        setUserStores(stores);

        // Set current store if none is set
        if (!currentStore && stores.length > 0) {
          setCurrentStore(stores[0]);
          
          // Get user role for this store
          const membership = membershipData.find(m => m.store_id === stores[0].id);
          const role = membership ? membership.role : stores[0].owner_id === user.id ? 'owner' : null;
          setUserRole(role);
        }
      } catch (err: any) {
        console.error('Error fetching stores:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUserStores();
  }, [user]);

  // Update user role when current store changes
  useEffect(() => {
    async function fetchUserRole() {
      if (!user || !currentStore) {
        setUserRole(null);
        return;
      }
      
      // If user is the owner
      if (currentStore.owner_id === user.id) {
        setUserRole('owner');
        return;
      }
      
      // Otherwise check membership
      const { data, error } = await supabase
        .from('store_members')
        .select('role')
        .eq('store_id', currentStore.id)
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } else {
        setUserRole(data.role);
      }
    }
    
    fetchUserRole();
  }, [currentStore, user]);

  const handleSetCurrentStore = (store: Store) => {
    setCurrentStore(store);
    // Save to localStorage for persistence
    localStorage.setItem('nimbus_current_store', JSON.stringify(store));
  };

  const createStore = async (storeData: Omit<Store, 'id' | 'created_at' | 'owner_id'>) => {
    if (!user) return { store: null, error: new Error('User not authenticated') };

    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          ...storeData,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setUserStores(prev => [...prev, data]);
      setCurrentStore(data);
      
      return { store: data, error: null };
    } catch (err: any) {
      console.error('Error creating store:', err);
      return { store: null, error: err };
    }
  };

  const updateStore = async (id: string, storeData: Partial<Store>) => {
    try {
      const { error } = await supabase
        .from('stores')
        .update(storeData)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setUserStores(prev => 
        prev.map(store => 
          store.id === id ? { ...store, ...storeData } : store
        )
      );
      
      if (currentStore && currentStore.id === id) {
        setCurrentStore(prev => prev ? { ...prev, ...storeData } : null);
      }
      
      return { error: null };
    } catch (err) {
      console.error('Error updating store:', err);
      return { error: err };
    }
  };

  const value = {
    currentStore,
    userStores,
    userRole,
    loading,
    error,
    setCurrentStore: handleSetCurrentStore,
    createStore,
    updateStore,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}