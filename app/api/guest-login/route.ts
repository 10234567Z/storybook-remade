import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })

  // Generate a random username for the guest user
  const guestUsername = `guest_${Math.random().toString(36).substring(2, 10)}`

  // Create a new user with a random email and password
  const { error: authError } = await supabase.auth.signUp({
    email: `${guestUsername}@guest.com`,
    password: `13121980zee)`,
    options: {
      data: {
        display_name: guestUsername,
        full_name: guestUsername,
        avatar_url: "",
        bio: "",
      },
    },
  })

  if (authError) {
    return NextResponse.json({ error: 'Failed to create guest user' }, { status: 500 })
  }

  // Sign in the guest user
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: `${guestUsername}@guest.com`,
    password: '13121980zee)',
  })

  if (signInError) {
    return NextResponse.json({ error: 'Failed to sign in guest user' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

