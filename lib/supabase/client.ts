import { createClient } from '@supabase/supabase-js'
import { isMockMode } from './mock-data'

// En mode développement sans Docker, nous utilisons des URLs mockées
const supabaseUrl = isMockMode() 
  ? 'http://localhost:54321'
  : process.env.NEXT_PUBLIC_SUPABASE_URL!

const supabaseAnonKey = isMockMode()
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'juriplateforme-auth',
  },
  global: {
    headers: {
      'x-application-name': 'juriplateforme',
    },
  },
})

// Helper functions
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export const getProfile = async (userId?: string) => {
  const user = userId || (await getCurrentUser())?.id
  if (!user) return null
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user)
    .single()
  
  if (error) throw error
  return data
}

export const updateProfile = async (updates: any) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const createDossier = async (dossierData: any) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('dossiers')
    .insert({
      ...dossierData,
      created_by: user.id,
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getDossiers = async (filters?: any) => {
  const user = await getCurrentUser()
  if (!user) return []
  
  let query = supabase
    .from('dossiers')
    .select('*')
    .or(`avocat_id.eq.${user.id},client_id.eq.${user.id}`)
  
  if (filters?.statut) {
    query = query.eq('statut', filters.statut)
  }
  
  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  
  const { data, error } = await query.order('updated_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const uploadDocument = async (file: File, dossierId: string, metadata: any) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `documents/${dossierId}/${fileName}`
  
  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)
  
  if (uploadError) throw uploadError
  
  // Create document record
  const { data, error } = await supabase
    .from('documents')
    .insert({
      dossier_id: dossierId,
      titre: metadata.titre || file.name,
      description: metadata.description,
      type: metadata.type || 'autre',
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getDocuments = async (dossierId: string) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('dossier_id', dossierId)
    .order('uploaded_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const createJournalEntry = async (entryData: any) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      ...entryData,
      parent_id: user.id,
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getJournalEntries = async (dossierId?: string) => {
  const user = await getCurrentUser()
  if (!user) return []
  
  let query = supabase
    .from('journal_entries')
    .select('*')
    .eq('parent_id', user.id)
  
  if (dossierId) {
    query = query.eq('dossier_id', dossierId)
  }
  
  const { data, error } = await query.order('date_incident', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const sendChatMessage = async (messageData: any) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      ...messageData,
      sender_id: user.id,
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getChatMessages = async (dossierId: string) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, sender:profiles!sender_id(full_name, avatar_url), recipient:profiles!recipient_id(full_name, avatar_url)')
    .eq('dossier_id', dossierId)
    .order('sent_at', { ascending: true })
  
  if (error) throw error
  return data || []
}

export const getTemplates = async (type?: string) => {
  let query = supabase
    .from('templates')
    .select('*')
    .eq('public', true)
  
  if (type) {
    query = query.eq('type', type)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const getResources = async (tags?: string[]) => {
  let query = supabase
    .from('resources')
    .select('*')
    .eq('verified', true)
  
  if (tags && tags.length > 0) {
    query = query.contains('tags', tags)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

// Real-time subscriptions
export const subscribeToDossierUpdates = (dossierId: string, callback: any) => {
  return supabase
    .channel(`dossier:${dossierId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'dossiers',
        filter: `id=eq.${dossierId}`,
      },
      callback
    )
    .subscribe()
}

export const subscribeToChatMessages = (dossierId: string, callback: any) => {
  return supabase
    .channel(`chat:${dossierId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `dossier_id=eq.${dossierId}`,
      },
      callback
    )
    .subscribe()
}

export const subscribeToDocuments = (dossierId: string, callback: any) => {
  return supabase
    .channel(`documents:${dossierId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'documents',
        filter: `dossier_id=eq.${dossierId}`,
      },
      callback
    )
    .subscribe()
}

// Cleanup subscriptions
export const unsubscribe = (subscription: any) => {
  supabase.removeChannel(subscription)
}