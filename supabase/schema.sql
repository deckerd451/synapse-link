-- Supabase schema for Synapse Link
--
-- This SQL script defines the database schema used by the Synapse Link
-- application when backed by Supabase.  Run this script in the SQL
-- editor of your Supabase project to create the necessary tables and
-- relations.  Feel free to adjust constraints (e.g. `NOT NULL` or
-- unique indexes) to match your requirements.

-- Enable extension for UUID generation if not already enabled
create extension if not exists "uuid-ossp";

-- --------------------------------------------------------------------
--  Table: profiles
--
-- Stores user profile information.  The `id` is the primary key and
-- corresponds to the Supabase Auth `user.id`.  The `skills` column is
-- stored as a text array; you can replace this with a JSON column if
-- preferred.
create table if not exists public.profiles (
  id uuid primary key,
  updated_at timestamptz default now(),
  name text,
  email text unique,
  bio text,
  skills text[] default '{}'::text[],
  image_url text
);

-- --------------------------------------------------------------------
--  Table: connections
--
-- Represents social connections between profiles.  The composite key
-- `(from_user_id, to_user_id)` ensures uniqueness, but we also
-- generate a deterministic `id` by concatenating the two UUIDs with a
-- colon for backward compatibility with the original design.  Feel free
-- to adjust this if you prefer natural surrogate keys.
create table if not exists public.connections (
  id text primary key,
  created_at timestamptz default now() not null,
  from_user_id uuid references public.profiles (id) on delete cascade,
  to_user_id uuid references public.profiles (id) on delete cascade,
  status text not null check (status in ('pending','accepted','declined'))
);
create unique index if not exists connections_unique_pair on public.connections (from_user_id, to_user_id);

-- --------------------------------------------------------------------
--  Table: endorsements
--
-- Records endorsements of a particular skill from one user to another.
-- The `id` is generated via `uuid_generate_v4()`; adjust as needed.
create table if not exists public.endorsements (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now() not null,
  skill text not null,
  endorsed_user_id uuid references public.profiles (id) on delete cascade,
  endorsed_by_user_id uuid references public.profiles (id) on delete cascade
);

-- Add indexes to speed up lookups
create index if not exists endorsements_endorsed_user_idx on public.endorsements (endorsed_user_id);
create index if not exists endorsements_endorsed_by_idx on public.endorsements (endorsed_by_user_id);