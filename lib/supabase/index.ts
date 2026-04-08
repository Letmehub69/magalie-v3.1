import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const getDossiers = async () => {
  const { data, error } = await supabase.from('dossiers').select('*').order('created_at', { ascending: false })
  if (error) {
    console.error('Error fetching dossiers:', error)
    return []
  }
  return data
}

export const createDossier = async (dossierData: any) => {
  const { data, error } = await supabase.from('dossiers').insert([dossierData]).select().single()
  if (error) throw error
  return data
}
