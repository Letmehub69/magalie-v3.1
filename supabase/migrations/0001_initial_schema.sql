-- Initial schema for JuriPlateforme
-- Conforme Loi 25 Québec

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text check (role in ('avocat', 'parent', 'admin')) default 'parent',
  barreau_number text,
  phone text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Additional fields for parents
  situation_familiale text,
  nombre_enfants integer default 0,
  -- Additional fields for avocats
  specialite text,
  cabinet text,
  ville text,
  province text default 'QC',
  -- Privacy settings
  data_retention_days integer default 365, -- Loi 25 compliance
  consent_given boolean default false
);

-- Dossiers (legal cases)
create table public.dossiers (
  id uuid default uuid_generate_v4() primary key,
  titre text not null,
  description text,
  type text check (type in ('familial', 'civil', 'penal', 'administratif', 'autre')) default 'familial',
  statut text check (statut in ('actif', 'archive', 'termine')) default 'actif',
  -- Parties involved
  avocat_id uuid references public.profiles(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete cascade,
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  date_ouverture date default current_date,
  date_cloture date,
  -- Security
  encryption_key text, -- For client-side encryption
  access_level text check (access_level in ('public', 'private', 'shared')) default 'private'
);

-- Documents table
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  dossier_id uuid references public.dossiers(id) on delete cascade,
  titre text not null,
  description text,
  type text check (type in ('contrat', 'preuve', 'correspondance', 'rapport', 'facture', 'autre')),
  file_path text not null, -- Path in Cloudflare R2
  file_size bigint,
  mime_type text,
  -- Metadata
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz default now(),
  version integer default 1,
  parent_document_id uuid references public.documents(id), -- For versioning
  -- Security
  encrypted boolean default true,
  encryption_iv text,
  -- OCR data (for search)
  ocr_text text,
  ocr_processed boolean default false
);

-- Journal entries for parental alienation cases
create table public.journal_entries (
  id uuid default uuid_generate_v4() primary key,
  parent_id uuid references public.profiles(id) on delete cascade,
  dossier_id uuid references public.dossiers(id) on delete cascade,
  date_incident date not null,
  heure_incident time,
  titre text not null,
  description text not null,
  -- Categorization
  categorie text check (categorie in ('denigrement', 'entrave_visite', 'manipulation', 'mensonge', 'autre')),
  gravite integer check (gravite between 1 and 5) default 1,
  -- Evidence
  preuves jsonb, -- Array of evidence references
  temoins text[],
  -- Emotional impact
  impact_enfant text,
  impact_parent text,
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  confidential boolean default true
);

-- AI Assistant interactions
create table public.ai_interactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  dossier_id uuid references public.dossiers(id) on delete cascade,
  prompt text not null,
  response text not null,
  model_used text default 'claude-3-5-sonnet',
  tokens_used integer,
  cost_estimate decimal(10,6),
  -- Context
  context_documents uuid[],
  context_journal_entries uuid[],
  -- Metadata
  created_at timestamptz default now(),
  ip_address inet,
  user_agent text
);

-- Secure chat messages
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  dossier_id uuid references public.dossiers(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete cascade,
  message text not null,
  -- Encryption
  encrypted boolean default true,
  encryption_iv text,
  -- Attachments
  attachments jsonb, -- Array of document references
  -- Metadata
  sent_at timestamptz default now(),
  read_at timestamptz,
  edited boolean default false
);

-- Templates for legal documents
create table public.templates (
  id uuid default uuid_generate_v4() primary key,
  titre text not null,
  description text,
  type text check (type in ('lettre_dpj', 'declaration', 'requete', 'contrat', 'autre')),
  content text not null, -- Markdown template
  variables jsonb, -- Template variables
  -- Metadata
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  public boolean default true,
  language text default 'fr'
);

-- Resources for parental alienation
create table public.resources (
  id uuid default uuid_generate_v4() primary key,
  titre text not null,
  type text check (type in ('article', 'video', 'guide', 'organisme', 'loi')),
  description text,
  url text,
  content text,
  -- Categorization
  tags text[],
  province text default 'QC',
  -- Metadata
  created_at timestamptz default now(),
  verified boolean default false,
  verified_by uuid references public.profiles(id)
);

-- Audit log for compliance
create table public.audit_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  action text not null,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now()
);

-- Create indexes for performance
create index idx_profiles_role on public.profiles(role);
create index idx_profiles_email on public.profiles(email);
create index idx_dossiers_avocat_id on public.dossiers(avocat_id);
create index idx_dossiers_client_id on public.dossiers(client_id);
create index idx_documents_dossier_id on public.documents(dossier_id);
create index idx_journal_entries_parent_id on public.journal_entries(parent_id);
create index idx_journal_entries_dossier_id on public.journal_entries(dossier_id);
create index idx_chat_messages_dossier_id on public.chat_messages(dossier_id);
create index idx_ai_interactions_user_id on public.ai_interactions(user_id);
create index idx_audit_log_user_id on public.audit_log(user_id);
create index idx_audit_log_created_at on public.audit_log(created_at);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.dossiers enable row level security;
alter table public.documents enable row level security;
alter table public.journal_entries enable row level security;
alter table public.ai_interactions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.templates enable row level security;
alter table public.resources enable row level security;
alter table public.audit_log enable row level security;

-- RLS Policies

-- Profiles: Users can only see their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Dossiers: Avocats can see their dossiers, clients can see dossiers they're involved in
create policy "Dossiers visibility" on public.dossiers
  for select using (
    auth.uid() = avocat_id or 
    auth.uid() = client_id or
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Documents: Only involved parties can see documents
create policy "Documents visibility" on public.documents
  for select using (
    exists (
      select 1 from public.dossiers d
      where d.id = documents.dossier_id
      and (d.avocat_id = auth.uid() or d.client_id = auth.uid())
    )
  );

-- Journal entries: Only the parent who created them can see them
create policy "Journal entries privacy" on public.journal_entries
  for all using (parent_id = auth.uid());

-- AI interactions: Users can only see their own interactions
create policy "AI interactions privacy" on public.ai_interactions
  for all using (user_id = auth.uid());

-- Chat messages: Only participants can see messages
create policy "Chat messages privacy" on public.chat_messages
  for select using (
    sender_id = auth.uid() or 
    recipient_id = auth.uid() or
    exists (
      select 1 from public.dossiers d
      where d.id = chat_messages.dossier_id
      and (d.avocat_id = auth.uid() or d.client_id = auth.uid())
    )
  );

-- Templates: Public templates are visible to all, private only to creator
create policy "Templates visibility" on public.templates
  for select using (
    public = true or 
    created_by = auth.uid() or
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Resources: All authenticated users can see verified resources
create policy "Resources visibility" on public.resources
  for select using (verified = true);

-- Audit log: Only admins can see audit log
create policy "Audit log admin only" on public.audit_log
  for all using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- Functions

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at_column();

create trigger update_dossiers_updated_at before update on public.dossiers
  for each row execute function update_updated_at_column();

create trigger update_documents_updated_at before update on public.documents
  for each row execute function update_updated_at_column();

create trigger update_journal_entries_updated_at before update on public.journal_entries
  for each row execute function update_updated_at_column();

create trigger update_templates_updated_at before update on public.templates
  for each row execute function update_updated_at_column();

-- Function for audit logging
create or replace function log_audit_event()
returns trigger as $$
begin
  insert into public.audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) values (
    auth.uid(),
    tg_op,
    tg_table_name,
    case when tg_op = 'DELETE' then old.id else new.id end,
    case when tg_op in ('UPDATE', 'DELETE') then row_to_json(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then row_to_json(new) else null end,
    null, -- Would need to get from request context
    null  -- Would need to get from request context
  );
  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Create triggers for audit logging on sensitive tables
create trigger audit_dossiers after insert or update or delete on public.dossiers
  for each row execute function log_audit_event();

create trigger audit_documents after insert or update or delete on public.documents
  for each row execute function log_audit_event();

create trigger audit_journal_entries after insert or update or delete on public.journal_entries
  for each row execute function log_audit_event();

-- Insert initial data

-- Sample templates
insert into public.templates (titre, type, content, variables, public) values
(
  'Lettre de signalement à la DPJ',
  'lettre_dpj',
  'À l''attention de la Direction de la protection de la jeunesse,

Je soussigné(e) [NOM_COMPLET], parent de l''enfant [NOM_ENFANT], né(e) le [DATE_NAISSANCE], vous écris pour signaler une situation préoccupante concernant mon enfant.

**Faits :**
[DESCRIPTION_DETAILLEE]

**Dates des incidents :**
[DATES_INCIDENTS]

**Preuves disponibles :**
[LISTE_PREUVES]

**Impact sur l''enfant :**
[IMPACT_ENFANT]

Je demande une évaluation de cette situation et une intervention appropriée pour assurer la sécurité et le bien-être de mon enfant.

Je reste à votre disposition pour toute information complémentaire.

Respectueusement,

[NOM_COMPLET]
[TÉLÉPHONE]
[EMAIL]',
  '{"NOM_COMPLET": "string", "NOM_ENFANT": "string", "DATE_NAISSANCE": "date", "DESCRIPTION_DETAILLEE": "text", "DATES_INCIDENTS": "text", "LISTE_PREUVES": "text", "IMPACT_ENFANT": "text", "TÉLÉPHONE": "string", "EMAIL": "string"}',
  true
);

-- Sample resources
insert into public.resources (titre, type, description, url, tags, verified) values
(
  'Éducaloi - Droit familial',
  'guide',
  'Guide complet sur le droit familial au Québec',
  'https://educaloi.qc.ca/categories/droit-familial/',
  '{"droit familial", "Québec", "guide"}',
  true
),
(
  'Loi sur la protection de la jeunesse',
  'loi',
  'Texte complet de la LPJ',
  'https://www.legisquebec.gouv.qc.ca/fr/document/lc/P-34.1',
  '{"LPJ", "protection jeunesse", "loi"}',
  true
);

-- Comments for documentation
comment on table public.profiles is 'User profiles with role-based permissions';
comment on table public.dossiers is 'Legal cases with attorney-client relationships';
comment on table public.documents is 'Legal documents with encryption and versioning';
comment on table public.journal_entries is 'Journal entries for parental alienation documentation';
comment on table public.ai_interactions is 'AI assistant interactions for audit and improvement';
comment on table public.chat_messages is 'Secure chat messages between parties';
comment on table public.templates is 'Legal document templates';
comment on table public.resources is 'Verified resources for parental alienation';
comment on table public.audit_log is 'Audit log for compliance with Loi 25';

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;