import { supabase } from "../supabase"

export async function notifyCoachRegistration({ coachEmail, coachName, coachId }) {
  const { error } = await supabase.functions.invoke("notify-coach-registration", {
    body: {
      coachEmail,
      coachName,
      coachId,
    },
  })

  return { error }
}
