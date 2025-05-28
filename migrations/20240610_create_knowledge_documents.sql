-- Create knowledge_categories table if not already present
CREATE TABLE IF NOT EXISTS public.knowledge_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    display_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create knowledge_documents table for admin-managed documents
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
    title text NOT NULL,
    file_path text NOT NULL,
    file_size integer,
    file_type text,
    page_count integer,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Optional: Add default categories
INSERT INTO public.knowledge_categories (slug, display_name)
VALUES
  ('joint-commission', 'Joint Commission'),
  ('dhcs', 'DHCS')
ON CONFLICT (slug) DO NOTHING; 