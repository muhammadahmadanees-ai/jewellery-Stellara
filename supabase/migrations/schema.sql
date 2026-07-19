-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    img TEXT,
    "order" INTEGER DEFAULT 0,
    parent_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'collection',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES public.collections(id) ON DELETE RESTRICT NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0),
    base_price NUMERIC NOT NULL DEFAULT 0 CHECK (base_price >= 0),
    discount_price NUMERIC DEFAULT NULL CHECK (discount_price IS NULL OR discount_price >= 0),
    description TEXT,
    img TEXT,
    sizes TEXT,
    refcode TEXT UNIQUE NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    collection TEXT,
    tile TEXT, -- matches lim's code compatibility, displayed as Product
    quantity TEXT NOT NULL DEFAULT '1',
    address TEXT,
    city TEXT,
    message TEXT,
    type TEXT NOT NULL DEFAULT 'Inquiry',
    status TEXT NOT NULL DEFAULT 'new',
    selling_price NUMERIC NOT NULL DEFAULT 0,
    base_price NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Secure public view that EXCLUDES base_price
CREATE OR REPLACE VIEW public.client_products WITH (security_invoker = true) AS
SELECT 
    id, 
    collection_id, 
    name, 
    price, 
    discount_price,
    description, 
    img, 
    sizes, 
    refcode, 
    "order", 
    created_at, 
    updated_at
FROM public.products;

-- Enable Row-Level Security
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Collections
DROP POLICY IF EXISTS "Allow public read collections" ON public.collections;
CREATE POLICY "Allow public read collections" ON public.collections FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow admin manage collections" ON public.collections;
CREATE POLICY "Allow admin manage collections" ON public.collections FOR ALL TO authenticated USING (true);

-- Products
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
CREATE POLICY "Allow public read products" ON public.products FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow admin manage products" ON public.products;
CREATE POLICY "Allow admin manage products" ON public.products FOR ALL TO authenticated USING (true);

-- Orders
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin manage orders" ON public.orders;
CREATE POLICY "Allow admin manage orders" ON public.orders FOR ALL TO authenticated USING (true);

-- Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to automatically snapshot prices on order insertion
CREATE OR REPLACE FUNCTION public.snapshot_order_prices()
RETURNS TRIGGER AS $$
DECLARE
    prod_price NUMERIC;
    prod_base_price NUMERIC;
BEGIN
    IF NEW.product_id IS NOT NULL THEN
        SELECT price, base_price INTO prod_price, prod_base_price 
        FROM public.products 
        WHERE id = NEW.product_id;
        
        NEW.selling_price = COALESCE(prod_price, 0);
        NEW.base_price = COALESCE(prod_base_price, 0);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_snapshot_order_prices ON public.orders;
CREATE TRIGGER tr_snapshot_order_prices
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.snapshot_order_prices();

