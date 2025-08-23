-- Fix infinite recursion in datasets table policy
-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Enable read access for all users" ON public.datasets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.datasets;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.datasets;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.datasets;

-- Create simple, non-recursive policies
CREATE POLICY "datasets_select_policy"
ON public.datasets
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "datasets_insert_policy"
ON public.datasets
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "datasets_update_policy"
ON public.datasets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "datasets_delete_policy"
ON public.datasets
FOR DELETE
TO authenticated
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY; 