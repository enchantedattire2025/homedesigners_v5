/*
  # Enable RLS on designers and wallpapers_3d tables

  ## Problem
  The `designers` and `wallpapers_3d` tables have RLS policies defined but
  RLS itself is NOT enabled. When RLS is disabled, all policies are ignored
  and any client with the anon key can read, insert, update, and delete
  every row — a critical security gap.

  ## Fix
  Enable RLS on both tables. The existing policies will immediately take
  effect, enforcing proper access control.

  ## Tables affected
  1. `designers` — has policies for public read of active designers,
     self-read, self-insert, self-update, admin update, and verification
     status updates.
  2. `wallpapers_3d` — has policies for public read of active wallpapers
     and admin CRUD.
*/

ALTER TABLE designers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallpapers_3d ENABLE ROW LEVEL SECURITY;