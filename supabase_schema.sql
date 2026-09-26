-- =======================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS PARA LAGO WOK ZHEN
-- Ejecutar en el SQL Editor de tu proyecto en Supabase
-- =======================================================

-- 1. TABLA DE CONFIGURACIÓN GLOBAL
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Valores predeterminados de configuración
INSERT INTO public.settings (key, value) VALUES
    ('exchange_rate', '40.00'),
    ('master_pin', 'ZHEN2026'),
    ('restaurant_name', 'LAGO WOK ZHEN'),
    ('restaurant_rif', 'J-50493821-0')
ON CONFLICT (key) DO NOTHING;

-- 2. TABLA DE USUARIOS Y OPERADORES (RBAC)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    pin TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier', -- 'admin', 'cashier', 'cook'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.users (id, name, username, pin, role) VALUES
    ('usr-1', 'Administrador Principal', 'admin', '1234', 'admin'),
    ('usr-2', 'Cajero de Turno', 'cajero', '0000', 'cashier'),
    ('usr-3', 'Cocinero / Chef', 'cocina', '1111', 'cook')
ON CONFLICT (id) DO NOTHING;

-- 3. TABLA DE CLIENTES Y DIRECTORIO COMERCIAL
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    doc_id TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    type TEXT DEFAULT 'Clientes', -- 'Clientes', 'Proveedores', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE MATERIA PRIMA E INVENTARIO
CREATE TABLE IF NOT EXISTS public.raw_materials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT NOT NULL DEFAULT 'kg', -- 'kg', 'g', 'l', 'ml', 'unit'
    stock NUMERIC NOT NULL DEFAULT 0,
    min_stock NUMERIC NOT NULL DEFAULT 0,
    cost NUMERIC NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE RECETAS Y PLATOS TERMINADOS
CREATE TABLE IF NOT EXISTS public.recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Platos Principales',
    sale_price NUMERIC NOT NULL DEFAULT 0,
    cost NUMERIC DEFAULT 0,
    image TEXT,
    ingredients JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE MESAS
CREATE TABLE IF NOT EXISTS public.tables (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    capacity INT DEFAULT 4,
    status TEXT DEFAULT 'free', -- 'free', 'occupied', 'billed'
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE ÓRDENES Y FACTURAS HISTÓRICAS
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT,
    type TEXT NOT NULL DEFAULT 'dine_in', -- 'dine_in', 'pickup', 'delivery'
    table_id TEXT,
    customer_name TEXT,
    client_id TEXT,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'sent_to_kitchen', 'paid', 'cancelled'
    total NUMERIC NOT NULL DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    payment JSONB DEFAULT '{}'::jsonb,
    payments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- 8. TABLA DE TURNOS Y ARQUEOS DE CAJA
CREATE TABLE IF NOT EXISTS public.shifts (
    id TEXT PRIMARY KEY,
    is_open BOOLEAN DEFAULT false,
    opened_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    opened_by_user TEXT,
    initial_cash JSONB DEFAULT '{}'::jsonb,
    sales JSONB DEFAULT '{}'::jsonb,
    actual_cash JSONB DEFAULT '{}'::jsonb,
    discrepancies JSONB DEFAULT '{}'::jsonb
);

-- HABILITAR ACCESO PÚBLICO (ANON KEY) PARA DESARROLLO / APLICACIÓN
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on raw_materials" ON public.raw_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on recipes" ON public.recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tables" ON public.tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on shifts" ON public.shifts FOR ALL USING (true) WITH CHECK (true);
