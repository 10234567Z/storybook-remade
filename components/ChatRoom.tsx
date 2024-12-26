'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Edit2, Trash2, X, Check } from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

interface ChatRoomProps {
  currentUserId: string
  otherUserId: string
  otherUsername: string
}

export default function ChatRoom({ currentUserId, otherUserId, otherUsername }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    const channel = supabase
      .channel('realtime messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
        }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prevMessages => [...prevMessages, payload.new as Message])
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prevMessages => prevMessages.map(msg => 
              msg.id === payload.new.id ? payload.new as Message : msg
            ))
          } else if (payload.eventType === 'DELETE') {
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, otherUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
    } else {
      setMessages(data)
    }
    setLoading(false)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const { error } = await supabase
      .from('messages')
      .insert({ content: newMessage, sender_id: currentUserId, receiver_id: otherUserId })

    if (error) {
      console.error('Error sending message:', error)
    } else {
      setNewMessage('')
    }
  }

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
  }

  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditContent('')
  }

  const saveEdit = async () => {
    if (!editingMessageId) return

    const { error } = await supabase
      .from('messages')
      .update({ content: editContent })
      .eq('id', editingMessageId)

    if (error) {
      console.error('Error updating message:', error)
    } else {
      setEditingMessageId(null)
      setEditContent('')
    }
  }

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) {
      console.error('Error deleting message:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <h2 className="text-xl font-semibold mb-4">Chat with {otherUsername}</h2>
      <div className="flex-grow overflow-y-auto mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`mb-2 ${message.sender_id === currentUserId ? 'text-right' : 'text-left'}`}
          >
            {editingMessageId === message.id ? (
              <div className="flex items-center justify-end space-x-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="p-2 border rounded dark:bg-gray-700 dark:text-white"
                />
                <button onClick={saveEdit} className="text-green-500 hover:text-green-600">
                  <Check size={20} />
                </button>
                <button onClick={cancelEditing} className="text-red-500 hover:text-red-600">
                  <X size={20} />
                </button>
              </div>
            ) : (
              <div className="group relative inline-block">
                <span 
                  className={`inline-block p-2 rounded-lg ${
                    message.sender_id === currentUserId 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-white'
                  }`}
                >
                  {message.content}
                </span>
                {message.sender_id === currentUserId && (
                  <div className="absolute top-0 right-0 mt-1 mr-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => startEditing(message)} className="text-gray-600 hover:text-gray-800 mr-1">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteMessage(message.id)} className="text-red-500 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow p-2 border rounded-l-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 transition-colors duration-200"
        >
          Send
        </button>
      </form>
    </div>
  )
}

