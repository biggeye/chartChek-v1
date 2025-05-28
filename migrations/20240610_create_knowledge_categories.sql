-- Create knowledge_categories table
CREATE TABLE IF NOT EXISTS public.knowledge_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    display_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Add category_id to documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.knowledge_categories(id) ON DELETE SET NULL;

-- Optional: Add a default category or two
INSERT INTO public.knowledge_categories (slug, display_name)
VALUES
  ('joint-commission', 'Joint Commission'),
  ('dhcs', 'DHCS')
ON CONFLICT (slug) DO NOTHING; 