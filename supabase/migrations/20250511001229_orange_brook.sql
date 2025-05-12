/*
  # Initial Schema for NIMBUS SaaS Application

  1. New Tables
    - `stores` - Stores information for multi-tenant architecture
    - `store_members` - Store staff members with role-based access
    - `products` - Product catalog for each store
    - `product_categories` - Categories for organizing products
    - `sales` - Sales transactions
    - `sale_items` - Line items for each sale
    - `inventory_transactions` - Stock movements

  2. Security
    - Enable RLS on all tables
    - Create policies for multi-tenant data isolation
    - Set up policies for different user roles (owner, admin, cashier)
*/

-- STORES TABLE
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  logo_url text,
  currency text DEFAULT 'USD',
  tax_rate numeric DEFAULT 0.0,
  owner_id uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Store Policies
CREATE POLICY "Store owners can do everything"
  ON stores
  USING (auth.uid() = owner_id);

CREATE POLICY "Store members can view"
  ON stores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_members
      WHERE store_id = id
      AND user_id = auth.uid()
    )
  );

-- STORE MEMBERS TABLE
CREATE TABLE IF NOT EXISTS store_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  store_id uuid REFERENCES stores(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'cashier')),
  pin_code text,
  UNIQUE(store_id, user_id)
);

ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;

-- Store Member Policies
CREATE POLICY "Store owners can manage members"
  ON store_members
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE id = store_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Store admins can view members"
  ON store_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_members
      WHERE store_id = store_members.store_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own membership"
  ON store_members
  FOR SELECT
  USING (user_id = auth.uid());

-- PRODUCT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  store_id uuid REFERENCES stores(id) NOT NULL,
  name text NOT NULL,
  UNIQUE(store_id, name)
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Product Category Policies
CREATE POLICY "Store members can view categories"
  ON product_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_members
      WHERE store_id = product_categories.store_id
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM stores
      WHERE id = product_categories.store_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Store owners and admins can manage categories"
  ON product_categories
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE id = product_categories.store_id
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM store_members
      WHERE store_id = product_categories.store_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  store_id uuid REFERENCES stores(id) NOT NULL,
  name text NOT NULL,
  sku text NOT NULL,
  barcode text,
  description text,
  price numeric NOT NULL,
  cost_price numeric,
  current_stock integer DEFAULT 0,
  image_url text,
  category_id uuid REFERENCES product_categories(id),
  is_active boolean DEFAULT true,
  UNIQUE(store_id, sku),
  UNIQUE(store_id, barcode)
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Product Policies
CREATE POLICY "Store members can view products"
  ON products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_members
      WHERE store_id = products.store_id
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM stores
      WHERE id = products.store_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Store owners and admins can manage products"
  ON products
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE id = products.store_id
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM store_members
      WHERE store_id = products.store_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  store_id uuid REFERENCES stores(id) NOT NULL,
  cashier_id uuid REFERENCES auth.users(id) NOT NULL,
  total_amount numeric NOT NULL,
  tax_amount numeric NOT NULL,
  payment_method text NOT NULL,
  status text DEFAULT 'completed' CHECK (status IN ('completed', 'voided', 'refunded')),
  notes text
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Sales Policies
CREATE POLICY "Store members can view sales"
  ON sales
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_members
      WHERE store_id = sales.store_id
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM stores
      WHERE id = sales.store_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Store members can create sales"
  ON sales
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM store_members
      WHERE store_id = sales.store_id
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM stores
      WHERE id = sales.store_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Store owners and admins can update sales"
  ON sales
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE id = sales.store_id
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM store_members
      WHERE store_id = sales.store_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  sale_id uuid REFERENCES sales(id) NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  subtotal numeric NOT NULL
);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Sale Items Policies
CREATE POLICY "Store members can view sale items"
  ON sale_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sales
      JOIN stores ON sales.store_id = stores.id
      WHERE sales.id = sale_items.sale_id
      AND (
        stores.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM store_members
          WHERE store_id = stores.id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Store members can create sale items"
  ON sale_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales
      JOIN stores ON sales.store_id = stores.id
      WHERE sales.id = sale_items.sale_id
      AND (
        stores.owner_id = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM store_members
          WHERE store_id = stores.id
          AND user_id = auth.uid()
        )
      )
    )
  );

-- INVENTORY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  store_id uuid REFERENCES stores(id) NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  quantity integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('stock-in', 'stock-out', 'adjustment', 'sale', 'return')),
  notes text,
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Inventory Transaction Policies
CREATE POLICY "Store members can view inventory transactions"
  ON inventory_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM store_members
      WHERE store_id = inventory_transactions.store_id
      AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM stores
      WHERE id = inventory_transactions.store_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Store owners and admins can manage inventory"
  ON inventory_transactions
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE id = inventory_transactions.store_id
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM store_members
      WHERE store_id = inventory_transactions.store_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create function to update product stock when inventory transaction is created
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the product's current stock based on the transaction
  UPDATE products
  SET current_stock = current_stock + NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_on_inventory_transaction
AFTER INSERT ON inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();

-- Create function to update product stock when a sale is created
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- For each product in the sale, create an inventory transaction and reduce stock
  INSERT INTO inventory_transactions (
    store_id,
    product_id,
    quantity,
    transaction_type,
    notes,
    user_id
  )
  SELECT
    s.store_id,
    si.product_id,
    -si.quantity, -- Negative quantity for stock reduction
    'sale',
    'Sale ID: ' || s.id,
    s.cashier_id
  FROM sales s
  JOIN sale_items si ON s.id = si.sale_id
  WHERE s.id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_inventory_transactions_on_sale
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_sale();