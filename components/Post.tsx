"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Heart } from "react-feather";
import { Edit2, MessageCircle, Trash2 } from "lucide-react";
import Comments from "./Comments";

interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  image_url: string;
  users: { displayname: string; avatarurl: string };
  likes: { user_id: string }[];
  comments: { id: string }[];
}

export default function Post({ post, currentUserId, isGuest }: { post: Post; currentUserId: string; isGuest: boolean }) {
  const [likes, setLikes] = useState(post.likes.length);
  const [comments, setComments] = useState(null as number | null);
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null as string | null);
  const [avaUrl, setAvaUrl] = useState(null as string | null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const supabase = createClientComponentClient();

  const handleLike = async () => {
    if (!currentUserId) return;

    setLikeAnimation(true);

    if (isLiked) {
      await supabase.from("likes").delete().match({ user_id: currentUserId, post_id: post.id });

      setLikes(likes - 1);
    } else {
      await supabase.from("likes").insert({ user_id: currentUserId, post_id: post.id });

      setLikes(likes + 1);
    }
    setIsLiked(!isLiked);

    setTimeout(() => setLikeAnimation(false), 300);
  };

  useEffect(() => {
    setComments(post.comments.length);
    const checkLikeStatus = async () => {
      if (currentUserId) {
        const { data, error } = await supabase.from("likes").select("id").match({ user_id: currentUserId, post_id: post.id }).single();

        if (data && !error) {
          setIsLiked(true);
        }
      }
    };

    async function UpdateSignedUrl() {
      if (post.image_url) {
        const { data, error } = await supabase.storage.from("post-images").createSignedUrl(post.image_url, 3600);
        if (error) {
          console.error("Error fetching signed url:", error);
        } else {
          setSignedUrl(data.signedUrl);
        }
      }

      if (post.users.avatarurl) {
        const { data: avaData, error: avaError } = await supabase.storage.from("avatar-images").createSignedUrl(post.users.avatarurl, 3600);
        if (avaError) {
          console.error("Error fetching signed url:", avaError);
        } else {
          setAvaUrl(avaData.signedUrl);
        }
      }
    }
    UpdateSignedUrl();
    checkLikeStatus();
  }, [post.id, currentUserId]);

  const handleEdit = async () => {
    if (currentUserId !== post.user_id) return;
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (currentUserId !== post.user_id) return;
    const { error } = await supabase.from("posts").update({ content: editedContent }).eq("id", post.id);

    if (error) {
      console.error("Error updating post:", error);
    } else {
      setIsEditing(false);
      post.content = editedContent;
    }
  };

  const handleDelete = async () => {
    if (currentUserId !== post.user_id) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);

    if (error) {
      console.error("Error deleting post:", error);
    }
    window.location.reload();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <img src={avaUrl || "https://via.placeholder.com/40"} alt={post.users.displayname} className="w-10 h-10 rounded-full mr-2 object-cover" />
          <Link href={`/profile/${post.users.displayname}`} className="font-bold text-gray-800 dark:text-white hover:underline">
            {post.users.displayname}
          </Link>
        </div>
        {currentUserId === post.user_id && (
          <div className="flex space-x-2">
            <button onClick={handleEdit} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Edit2 size={18} />
            </button>
            <button onClick={handleDelete} className="text-red-500 hover:text-red-700">
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
      {isEditing ? (
        <div className="mb-4">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            rows={3}
          />
          <div className="flex justify-end mt-2 space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-200"
            >
              Cancel
            </button>
            <button onClick={handleSaveEdit} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200">
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 dark:text-gray-300 mb-4 break-words">{post.content}</p>
      )}
      {post.image_url && <img src={signedUrl!} alt="Post image" className="w-full h-[500px] rounded-lg mb-2 object-cover" />}
      <div className="flex items-center text-gray-500 dark:text-gray-400">
        <button
          onClick={handleLike}
          disabled={isGuest}
          className={`flex items-center space-x-1 ${isGuest ? "opacity-50 cursor-not-allowed" : "hover:text-red-500"} transition duration-200`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-current text-red-500" : ""} ${likeAnimation ? "animate-pulse" : ""}`} />
          <span>{likes}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          disabled={isGuest}
          className={`flex items-center space-x-1 ${isGuest ? "opacity-50 cursor-not-allowed" : "hover:text-blue-500"} transition duration-200`}
        >
          <MessageCircle className="w-5 h-5" />
          <span>{comments}</span>
        </button>
      </div>
      {showComments && <Comments postId={post.id} />}
      {isGuest && <p className="text-sm text-gray-500 mt-2">Guest users cannot like or comment on posts</p>}
    </div>
  );
}
