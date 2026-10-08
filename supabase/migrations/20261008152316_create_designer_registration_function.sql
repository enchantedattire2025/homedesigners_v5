/*
# Create SECURITY DEFINER function for designer self-registration

## Problem
When "Confirm Email" is enabled in Supabase Auth, `signUp()` creates the
auth account but returns NO session. The user is unauthenticated until they
click the confirmation link. The `designers` table INSERT RLS policy requires
`auth.uid() = user_id` scoped to `authenticated`, so a client-side INSERT
from an unauthenticated (anon) session fails silently or never runs. This
left designer profiles un-saved even though auth accounts were created.

## Solution
Create a SECURITY DEFINER function `register_designer_profile` that:
1. Verifies the provided `p_user_id` exists in `auth.users` (prevents
   inserting designer rows for non-existent auth accounts).
2. Verifies no designer row already exists for that user_id (prevents
   duplicates).
3. Inserts the designer row with all profile fields, bypassing RLS because
   the function runs as the table owner.
4. Returns the new designer row's id on success.

## Security
- SECURITY DEFINER: runs with the owner's privileges, bypassing RLS on
  `designers`. This is necessary because the caller has no session yet
  (email not confirmed).
- The function only inserts; it cannot read or modify other designers' data.
- The `p_user_id` MUST correspond to a real `auth.users` row — verified by
  the EXISTS check against `auth.users`.
- Duplicate prevention: if a designer row already exists for this user_id,
  the function returns an error instead of creating a duplicate.
- Granted EXECUTE to `anon` so the unauthenticated frontend can call it
  right after `signUp()` without needing a session.
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
