-- RUN THIS SQL IN YOUR SUPABASE SQL EDITOR:
-- https://supabase.com/dashboard/project/demctbygmsrlycyaewwy/sql/new

-- 1. Add the is_bestseller column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;

-- 2. Drop the existing view first to allow column reordering
DROP VIEW IF EXISTS public.client_products;

-- 3. Re-create the public client_products view to include the new column
CREATE VIEW public.client_products WITH (security_invoker = true) AS
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
    is_bestseller,
    created_at, 
    updated_at
FROM public.products;

-- 4. Create the best_seller_products view to calculate actual sales dynamically
DROP VIEW IF EXISTS public.best_seller_products;

CREATE VIEW public.best_seller_products AS
WITH product_sales AS (
    SELECT 
        product_id,
        SUM(COALESCE(NULLIF(regexp_replace(quantity, '\D', '', 'g'), ''), '0')::INTEGER) as total_sold
    FROM public.orders
    WHERE product_id IS NOT NULL
    GROUP BY product_id
)
SELECT 
    p.id, 
    p.collection_id, 
    p.name, 
    p.price, 
    p.discount_price,
    p.description, 
    p.img, 
    p.sizes, 
    p.refcode, 
    p.order,
    p.is_bestseller,
    COALESCE(ps.total_sold, 0) as sales_count,
    p.created_at, 
    p.updated_at
FROM public.products p
LEFT JOIN product_sales ps ON p.id = ps.product_id
ORDER BY 
    (CASE WHEN p.is_bestseller = true THEN 1 ELSE 0 END) DESC,
    COALESCE(ps.total_sold, 0) DESC,
    p.order ASC,
    p.name ASC
LIMIT 3;
