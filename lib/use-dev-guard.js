'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/* ============================================================
   useDevGuard
   Call at the top of dev-only pages.
   Redirects to / if the user does not have is_dev = true.
   Admins without is_dev are also redirected — dev pages are
   not visible to regular admins.
   Returns { loading } so the page can show a skeleton.
   ============================================================ */
export function useDevGuard() {
  const [loading, setLoading] = useState(true)
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('portal_profiles')
        .select('is_dev')
        .eq('id', user.id)
        .single()

      if (!profile?.is_dev) { router.push('/'); return }

      setLoading(false)
    }
    check()
  }, [])

  return { loading }
}
