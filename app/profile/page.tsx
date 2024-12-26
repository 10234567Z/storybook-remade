import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProfileComponent from '@/components/ProfileComponent'


export default async function Profile() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()


    console.log(profile.email.includes("guest"))

  return <ProfileComponent profile={profile} isOwnProfile={true} currentUserId={session.user.id} isGuest={profile.email.includes("guest")} />
}

