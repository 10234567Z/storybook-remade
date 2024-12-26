"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import FollowButton from "./FollowButton";

interface User {
  id: string;
  displayname: string;
  avatarurl: string;
}

interface FollowListProps {
  username: string;
  listType: "followers" | "following";
  currentUserId: string;
  isGuest: boolean;
}

export default function FollowList({ username, listType, currentUserId, isGuest }: FollowListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [avaUrls, setAvaUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchUsers();
  }, [username, listType]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: profileData, error: profileError } = await supabase.from("users").select("id").eq("displayname", username).single();

      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from("follows")
        .select(
          `
          ${
            listType === "followers"
              ? "follower:users!follower_id(id, displayname, avatarurl)"
              : "following:users!following_id(id, displayname, avatarurl)"
          }
        `
        )
        .eq(listType === "followers" ? "following_id" : "follower_id", profileData.id);

      if (error) throw error;

      setUsers(data.map((follow: any) => follow[listType === "followers" ? "follower" : "following"]));
      //Add signedUrl of avatarUrl in data of each user
      await Promise.all(
        data.map(async (follow: any) => {
          const { data: avaData, error: avaError } = await supabase.storage
            .from("avatar-images")
            .createSignedUrl(follow[listType === "followers" ? "follower" : "following"].avatarurl, 3600);
          if (avaError) {
            console.error("Error fetching signed url:", avaError);
          } else {
            setAvaUrls((prevAvaUrls) => [...prevAvaUrls, avaData.signedUrl]);
          }
        })
      );
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;


  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">{listType === "followers" ? "Followers" : "Following"}</h2>
      {users.map((user, index) => (
        <div key={user.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <Link href={`/profile/${user.displayname}`} className="flex items-center">
            <img
              src={ user.avatarurl ? avaUrls[index] : "https://via.placeholder.com/40"}
              alt={user.displayname}
              className="w-10 h-10 rounded-full mr-4 object-cover"
            />
            <span className="font-semibold">{user.displayname}</span>
          </Link>
          {currentUserId !== user.id && <FollowButton currentUserId={currentUserId} targetUserId={user.id} isGuest={isGuest} />}
        </div>
      ))}
    </div>
  );
}
