import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  storeId: string | null;
  taxRate: number;
  
  // Getters
  itemCount: () => number;
  subtotal: () => number;
  taxAmount: () => number;
  total: () => number;
  
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setStoreId: (storeId: string) => void;
  setTaxRate: (rate: number) => void;
  
  // For offline sync
  markAsPending: () => void;
  isPending: boolean;
  lastUpdated: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      storeId: null,
      taxRate: 0,
      isPending: false,
      lastUpdated: Date.now(),
      
      // Getters
      itemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      subtotal: () => {
        return get().items.reduce((total, item) => total + item.subtotal, 0);
      },
      
      taxAmount: () => {
        return get().subtotal() * get().taxRate;
      },
      
      total: () => {
        return get().subtotal() + get().taxAmount();
      },
      
      // Actions
      addItem: (product, quantity = 1) => {
        const { items, storeId } = get();
        
        // Ensure the product belongs to the current store
        if (storeId && product.store_id !== storeId) {
          console.error('Cannot add product from a different store');
          return;
        }
        
        // Check if product already exists in cart
        const existingItemIndex = items.findIndex(item => item.product.id === product.id);
        
        if (existingItemIndex !== -1) {
          // Update existing item
          const newItems = [...items];
          const newQuantity = newItems[existingItemIndex].quantity + quantity;
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newQuantity,
            subtotal: product.price * newQuantity,
          };
          
          set({ 
            items: newItems,
            lastUpdated: Date.now(),
          });
        } else {
          // Add new item
          set({ 
            items: [
              ...items, 
              { 
                product, 
                quantity, 
                subtotal: product.price * quantity 
              }
            ],
            storeId: storeId || product.store_id, // Set store ID if not set
            lastUpdated: Date.now(),
          });
        }
      },
      
      updateItemQuantity: (productId, quantity) => {
        const { items } = get();
        
        if (quantity <= 0) {
          // Remove item if quantity is zero or negative
          return get().removeItem(productId);
        }
        
        const newItems = items.map(item => {
          if (item.product.id === productId) {
            return {
              ...item,
              quantity,
              subtotal: item.product.price * quantity,
            };
          }
          return item;
        });
        
        set({ 
          items: newItems,
          lastUpdated: Date.now(),
        });
      },
      
      removeItem: (productId) => {
        set({ 
          items: get().items.filter(item => item.product.id !== productId),
          lastUpdated: Date.now(),
        });
      },
      
      clearCart: () => {
        set({ 
          items: [],
          lastUpdated: Date.now(),
        });
      },
      
      setStoreId: (storeId) => {
        // If changing stores, clear the cart
        if (get().storeId && get().storeId !== storeId) {
          get().clearCart();
        }
        set({ storeId });
      },
      
      setTaxRate: (rate) => {
        set({ taxRate: rate });
      },
      
      markAsPending: () => {
        set({ isPending: true });
      },
    }),
    {
      name: 'nimbus-cart',
      partialize: (state) => ({
        items: state.items,
        storeId: state.storeId,
        taxRate: state.taxRate,
        isPending: state.isPending,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);