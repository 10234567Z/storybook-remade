"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Post from "./Post";
import InfiniteScroll from "react-infinite-scroll-component";

const POSTS_PER_PAGE = 10;

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

export default function ProfilePostList({user_id, isGuest} : { user_id: string; isGuest: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    if (loading) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        users (displayname, avatarurl),
        likes (user_id),
        comments (id)
      `
      )
      .range(page * POSTS_PER_PAGE, (page + 1) * POSTS_PER_PAGE - 1)
      .order("created_at", { ascending: false })
      .eq("user_id", user_id);

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setPosts((prevPosts) => [...prevPosts, ...data]);
      setPage((prevPage) => prevPage + 1);
      setHasMore(data.length === POSTS_PER_PAGE);
    }
    setLoading(false);
  };

  return (
    <InfiniteScroll
      dataLength={posts.length}
      next={fetchPosts}
      hasMore={hasMore}
      loader={<LoadingSpinner />}
      endMessage={<p className="text-center text-gray-500 dark:text-gray-400 my-4">You&apos;ve seen all posts</p>}
    >
      <div className="space-y-4">
        {posts.map((post) => (
          <Post key={post.id} post={post} currentUserId={user_id} isGuest={isGuest} />
        ))}
      </div>
    </InfiniteScroll>
  );
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center my-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
  </div>
);
