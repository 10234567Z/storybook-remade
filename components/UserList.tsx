"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

interface User {
  id: string;
  displayname: string;
  avatarurl: string;
}

interface avaList {
  url: string;
  userId: string;
}

export default function UserList({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasConversations, setHasConversations] = useState(false);
  const [avaUrls, setAvaUrls] = useState<avaList[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchUsers();
  }, [currentUserId]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: conversations, error: conversationsError } = await supabase
      .from("messages")
      .select("sender_id, receiver_id")
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    if (conversationsError) {
      console.error("Error fetching conversations:", conversationsError);
      setLoading(false);
      return;
    }

    setHasConversations(conversations.length > 0);

    if (conversations.length === 0) {
      const { data: allUsers, error: usersError } = await supabase.from("users").select("id, displayname, avatarurl").neq("id", currentUserId);

      if (usersError) {
        console.error("Error fetching users:", usersError);
      } else {
        await Promise.all(
          allUsers.map(async (user) => {
            const { data, error } = await supabase.storage.from("avatar-images").createSignedUrl(user.avatarurl, 3600);
            if (error) {
              console.error("Error fetching signed URL:", error);
            } else {
              setAvaUrls((prev) => [...prev, { url: data.signedUrl, userId: user.id }]);
            }
          })
        );
        setUsers(allUsers);
      }
    } else {
      const userIds = new Set(conversations.flatMap((c) => [c.sender_id, c.receiver_id]));
      userIds.delete(currentUserId);

      const { data: activeUsers, error: usersError } = await supabase
        .from("users")
        .select("id, displayname, avatarurl")
        .in("id", Array.from(userIds));

      if (usersError) {
        console.error("Error fetching users:", usersError);
      } else {
        await Promise.all(
          activeUsers.map(async (user) => {
            const { data, error } = await supabase.storage.from("avatar-images").createSignedUrl(user.avatarurl, 3600);
            if (error) {
              console.error("Error fetching signed URL:", error);
            } else {
              setAvaUrls((prev) => [...prev, { url: data.signedUrl, userId: user.id }]);
            }
          })
        );
        setUsers(activeUsers);
      }
    }

    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {hasConversations ? (
        users.map((user, index) => (
          <Link
            key={user.id}
            href={`/messages/${user.displayname}`}
            className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow duration-200"
          >
            <img
              src={avaUrls.find((ava) => ava.userId === user.id)?.url || "https://via.placeholder.com/40"}
              alt={user.displayname}
              className="w-10 h-10 rounded-full mr-3 object-cover"
            />
            <p className="font-semibold">{user.displayname}</p>
          </Link>
        ))
      ) : (
        <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-700 dark:text-gray-300">You haven&apos;t started any conversations yet.</p>
          <p className="text-gray-700 dark:text-gray-300 mt-2">How about chatting with someone?</p>
          <div className="mt-4 space-y-2">
            {users.slice(0, 3).map((user) => (
              <Link
                key={user.id}
                href={`/messages/${user.displayname}`}
                className="block p-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
              >
                Chat with {user.displayname}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
