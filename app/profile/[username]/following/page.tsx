import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import FollowList from '@/components/FollowList'
interface UserProfileParams {
    params: {
      username: string;
    };
  }
export default async function FollowingPage({ params: { username } }: UserProfileParams) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return <div>Please log in to view this page.</div>
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('displayname', username)
    .single()

  if (!profile) {
    notFound()
  }

  return <FollowList username={username} listType="following" currentUserId={session.user.id} isGuest={session!.user.email!.includes("guest")} />  
}

