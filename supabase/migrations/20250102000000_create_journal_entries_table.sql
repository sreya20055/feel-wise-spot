-- Create journal_entries table
create table public.journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  content text not null,
  prompt text,
  mood_rating integer check (mood_rating >= 1 and mood_rating <= 10),
  tags text[] default array[]::text[],
  is_voice_entry boolean default false not null,
  audio_url text,
  ai_feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS (Row Level Security)
alter table public.journal_entries enable row level security;

-- Create policies
create policy "Users can view own journal entries" on public.journal_entries
  for select using (auth.uid() = user_id);

create policy "Users can insert own journal entries" on public.journal_entries
  for insert with check (auth.uid() = user_id);

create policy "Users can update own journal entries" on public.journal_entries
  for update using (auth.uid() = user_id);

create policy "Users can delete own journal entries" on public.journal_entries
  for delete using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_journal_entries_updated_at
  before update on public.journal_entries
  for each row execute procedure public.handle_updated_at();

-- Create indexes for better performance
create index journal_entries_user_id_idx on public.journal_entries(user_id);
create index journal_entries_created_at_idx on public.journal_entries(created_at desc);
create index journal_entries_mood_rating_idx on public.journal_entries(mood_rating);
create index journal_entries_tags_idx on public.journal_entries using gin(tags);