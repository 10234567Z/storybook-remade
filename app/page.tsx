import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PostList from '@/components/PostList'
import CreatePost from '@/components/CreatePost'

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Home</h1>
      <CreatePost />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <PostList currentUserId={session.user.id} isGuest={session.user.email!.includes("guest")} />
        </div>
      </div>
    </div>
  )
}

