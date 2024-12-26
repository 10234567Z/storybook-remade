'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/auth-helpers-nextjs'
import { Edit2, Trash2 } from 'lucide-react'
import { MoreVertical } from 'react-feather'


interface Comment {
  id: string
  content: string
  user_id: string
  post_id: string
  created_at: string
  user: TableUser
}

interface TableUser {
  displayname: string
  avatarurl: string
}


export default function Comments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [avaUrl, setAvaUrl] = useState(null as string | null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchComments()
    fetchCurrentUser()

    const channel = supabase
      .channel('realtime comments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, payload => {
        if (payload.eventType === 'INSERT') {
          setComments(prevComments => [payload.new as Comment, ...prevComments])
        } else if (payload.eventType === 'DELETE') {
          setComments(prevComments => prevComments.filter(comment => comment.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          setComments(prevComments => prevComments.map(comment => 
            comment.id === payload.new.id ? { ...comment, ...payload.new as Comment } : comment
          ))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId, supabase])

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:users(displayname, avatarurl)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching comments:', error)
    } else {
      setComments(data)
    }
  }

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    console.log(user.user_metadata.avatar_url)
    const { data: avaUrl , error } = await supabase.storage.from('avatar-images').createSignedUrl(user.user_metadata.avatar_url, 3600)
    if (error) {
      console.error('Error fetching signed url:', error)
    } else {
      setAvaUrl(avaUrl.signedUrl)
    }
    setCurrentUser(user)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    const { data, error } = await supabase
      .from('comments')
      .insert({ content: newComment, user_id: currentUser.id, post_id: postId })
      .select('*, user:users(displayname, avatarurl)')
      .single()

    if (error) {
      console.error('Error creating comment:', error)
    } else {
      setNewComment('')
      setComments(prevComments => [data, ...prevComments])
    }
  }

  const handleEdit = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .update({ content: editContent })
      .eq('id', commentId)
      .select()

    if (error) {
      console.error('Error updating comment:', error)
    } else {
      setEditingComment(null)
      setEditContent('')

      // Edits in UI
        setComments(prevComments => prevComments.map(comment => 
            comment.id === commentId ? { ...comment, content: editContent } : comment
        ))
    }
  }

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    // removes from UI
    setComments(prevComments => prevComments.filter(comment => comment.id !== commentId))

    if (error) {
      console.error('Error deleting comment:', error)
    }
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Comments</h3>
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          rows={3}
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-600 transition duration-200"
        >
          Post Comment
        </button>
      </form>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <img
                  src={avaUrl || 'https://via.placeholder.com/40'}
                  alt={comment.user.displayname}
                  className="w-8 h-8 rounded-full mr-2 object-cover"
                />
                <span className="font-semibold">{comment.user.displayname}</span>
              </div>
              {currentUser && currentUser.id === comment.user_id && (
                <div className="relative group">
                  <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <MoreVertical size={24} />
                  </button>
                  <div className="absolute right-0 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 hidden group-hover:block">
                    <button
                      onClick={() => {
                        setEditingComment(comment.id)
                        setEditContent(comment.content)
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <Edit2 size={16} className="mr-2" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                    >
                      <Trash2 size={16} className="mr-2" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
            {editingComment === comment.id ? (
              <form onSubmit={(e) => {
                e.preventDefault()
                handleEdit(comment.id)
              }}>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  rows={3}
                />
                <div className="flex justify-end mt-2 space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingComment(null)}
                    className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

