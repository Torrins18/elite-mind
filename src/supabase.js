import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl || "https://pmjptxnwrboesprlfeod.supabase.co",
  supabaseKey || "sb_publishable_g0oPm15wdjS12jmsl_1RRA_klo92Css"
)
