/*
# Create SECURITY DEFINER function for designer self-registration

## Purpose
Creates the `register_designer_profile` PostgreSQL function that the
designer registration page calls via supabase.rpc(). This function was
missing from the production database, causing the error:
  "Could not find the function public.register_designer_profile(...)
   in the schema cache"

## What this migration does
1. Creates `public.register_designer_profile` (SECURITY DEFINER) with 17
   parameters matching exactly what the frontend sends.
2. Grants EXECUTE to `anon` and `authenticated` so the function works
   immediately after signUp() — even before email confirmation creates
   a session (the caller has no authenticated session at that point).
3. Sends NOTIFY pgrst to refresh PostgREST's schema cache so the
   function is immediately discoverable via the REST API.

## Function behavior
- Verifies the auth account exists for the given user_id
- Prevents duplicate designer profiles for the same user_id
- Inserts a new designer row with verification_status='pending',
  is_verified=false, is_active=true
- Returns the new designer's UUID id

## Security
- SECURITY DEFINER: runs with the owner's privileges, bypassing RLS on
  `designers`. Required because the caller has no session yet.
- Only inserts; cannot read or modify other designers' data.
- `p_user_id` must correspond to a real `auth.users` row.
- Duplicate prevention: errors if a designer row already exists.
- EXECUTE granted to anon + authenticated only.
- search_path pinned to public.

## Important notes
1. No data is modified or deleted.
2. No table schema changes.
3. Safe to re-run (CREATE OR REPLACE).
*/

CREATE OR REPLACE FUNCTION public.register_designer_profile(
  p_user_id uuid,
  p_name text,
  p_email text,
  p_specialization text,
  p_location text,
  p_phone text DEFAULT NULL,
  p_experience integer DEFAULT 0,
  p_bio text DEFAULT NULL,
  p_website text DEFAULT NULL,
  p_starting_price text DEFAULT NULL,
  p_instagram_url text DEFAULT NULL,
  p_profile_image text DEFAULT NULL,
  p_business_type text DEFAULT NULL,
  p_google_location_url text DEFAULT NULL,
  p_services text[] DEFAULT '{}',
  p_materials_expertise text[] DEFAULT '{}',
  p_awards text[] DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Auth account not found for user_id %', p_user_id;
  END IF;

  IF EXISTS (SELECT 1 FROM designers WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Designer profile already exists for this user';
  END IF;

  INSERT INTO designers (
    user_id, name, email, phone, specialization, experience, location,
    bio, website, starting_price, instagram_url, profile_image,
    business_type, google_location_url, services, materials_expertise,
    awards, verification_status, is_verified, is_active
  )
  VALUES (
    p_user_id, p_name, p_email, p_phone, p_specialization, p_experience,
    p_location, p_bio, p_website, p_starting_price, p_instagram_url,
    p_profile_image, p_business_type, p_google_location_url, p_services,
    p_materials_expertise, p_awards, 'pending', false, true
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_designer_profile TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
