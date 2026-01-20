-- Create favorite_foods table
create table public.favorite_foods (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  calories numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,
  image_url text,
  portion_unit text default 'serving',
  portion_quantity numeric default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(user_id, name)  -- Prevent duplicate favorites per user
);

-- Enable RLS
alter table public.favorite_foods enable row level security;

-- Create Policies
create policy "Users can view their own favorites"
  on public.favorite_foods for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on public.favorite_foods for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public.favorite_foods for delete
  using (auth.uid() = user_id);
