"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface FollowButtonProps {
  currentUserId: string;
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  isGuest?: boolean;
}

export default function FollowButton({ currentUserId, targetUserId, onFollowChange, isGuest }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkFollowStatus();
  }, [currentUserId, targetUserId]);

  const checkFollowStatus = async () => {
    const { data, error } = await supabase.from("follows").select("*").eq("follower_id", currentUserId).eq("following_id", targetUserId).single();

    if (error) {
      console.error("Error checking follow status:", error);
    } else {
      setIsFollowing(!!data);
    }
  };

  const handleFollow = async () => {
    setIsLoading(true);
    if (isFollowing) {
      const { error } = await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", targetUserId);
      if (error) {
        console.error("Error unfollowing:", error);
      } else {
        setIsFollowing(false);
        onFollowChange && onFollowChange(false);
      }
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: currentUserId, following_id: targetUserId });

      if (error) {
        console.error("Error following:", error);
      } else {
        setIsFollowing(true);
        onFollowChange && onFollowChange(true);
      }
    }
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={handleFollow}
        disabled={isLoading || isGuest}
        className={`px-4 py-2 rounded ${
          isFollowing ? "bg-gray-200 text-gray-800 hover:bg-gray-300" : "bg-blue-500 text-white hover:bg-blue-600"
        } transition-colors duration-200 disabled:opacity-50`}
      >
        {isLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
      </button>
      {isGuest && <p className="text-sm text-gray-500 mt-2">Guest users cannot follow other users</p>}
    </>
  );
}
