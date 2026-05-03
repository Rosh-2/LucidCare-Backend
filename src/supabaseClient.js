import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sigrdkfntlziwerdlwfo.supabase.co'
const supabaseKey = 'sb_publishable_uWhyXopJB21sot11BvwWZQ_ZvALtiv1'

export const supabase = createClient(supabaseUrl, supabaseKey)