'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/* ============================================================
   useAdminGuard
   Call at the top of every admin page.
   Redirects to / if the user is not an admin.
   Returns { loading } so the page can show a skeleton
   while the check is in progress.
   ============================================================ */
export function useAdminGuard() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('portal_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) { router.push('/'); return }

      setLoading(false)
    }
    check()
  }, [])

  return { loading }
}
