import { createClient } from '@supabase/supabase-js'

// Replace these with your actual keys from Supabase Dashboard -> Project Settings -> API
const supabaseUrl = 'https://uivxggkxtohyyaxdqcfk.supabase.co'
const supabaseKey = 'sb_publishable_mcgMyHIf7cqiv5GrL3fEjA_zMGC_mM5'

export const supabase = createClient(supabaseUrl, supabaseKey)