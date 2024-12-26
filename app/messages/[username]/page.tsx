import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import ChatRoom from '@/components/ChatRoom'

interface Params {
  params: {
    username: string;
  };
}

export default async function ChatPage({ params: { username } }: Params) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: otherUser } = await supabase
    .from('users')
    .select('id, displayname')
    .eq('displayname', username)
    .single()

  if (!otherUser) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ChatRoom 
        currentUserId={session.user.id} 
        otherUserId={otherUser.id}
        otherUsername={otherUser.displayname}
      />
    </div>
  )
}

