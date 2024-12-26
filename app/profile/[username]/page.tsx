import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ProfileComponent from '@/components/ProfileComponent'

interface UserProfileParams {
  params: {
    username: string;
  };
}

export default async function UserProfile({ params: { username } }: UserProfileParams) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('displayname', username)
    .single()

  if (!profile) {
    notFound()
  }

  const isOwnProfile = session?.user.id === profile.id

  console.log(session!.user.email!.includes("guest"))

  return <ProfileComponent profile={profile} isOwnProfile={isOwnProfile} currentUserId={session!.user.id}  isGuest={session!.user.email!.includes("guest")}/>
}

