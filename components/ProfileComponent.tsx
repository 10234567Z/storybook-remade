"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import ProfilePostList from "./profilePostList";
import FollowButton from "./FollowButton";
import Link from "next/link";

interface Users {
  id: string;
  displayname: string;
  avatarurl: string;
  fullname: string;
  bio: string;
  email: string;
}

interface ProfileComponentProps {
  profile: Users;
  isOwnProfile: boolean;
  currentUserId: string;
  isGuest: boolean;
}

export default function ProfileComponent(profileProps: ProfileComponentProps) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profileProps.profile.displayname);
  const [fullName, setFullName] = useState(profileProps.profile.fullname);
  const [bio, setBio] = useState(profileProps.profile.bio);
  const [avatarUrl, setAvatarUrl] = useState(null as null | string);
  const [avatarFile, setAvatarFile] = useState(null as File | null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null as null | string);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const supabase = createClientComponentClient();
  const { push } = useRouter();

  useEffect(() => {
    async function fetchAvatar() {
      const { data: avaData, error: avaError } = await supabase.storage.from("avatar-images").createSignedUrl(profileProps.profile.avatarurl, 3600);
      if (avaError) {
        console.error("Error fetching signed url:", avaError);
      } else {
        setAvatarUrl(avaData.signedUrl);
      }
    }
    fetchAvatar();
    fetchFollowCounts();
  }, []);

  const fetchFollowCounts = async () => {
    const { data: followers, error: followersError } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", profileProps.profile.id);

    const { data: following, error: followingError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", profileProps.profile.id);

    if (followersError) console.error("Error fetching followers:", followersError);
    if (followingError) console.error("Error fetching following:", followingError);

    setFollowersCount(followers?.length || 0);
    setFollowingCount(following?.length || 0);
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    let newAvatarUrl = avatarUrl;

    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage.from("avatar-images").upload(`${profileProps.profile.id}/${fileName}`, avatarFile);

      if (uploadError) {
        setError("Error uploading avatar");
        setIsLoading(false);
        return;
      }

      const { error: removeErr } = await supabase.storage.from("avatar-images").remove([profileProps.profile.avatarurl]);
      if (removeErr) {
        setError("Error removing old avatar");
        return;
      }

      newAvatarUrl = data.path;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: username,
        full_name: fullName,
        bio,
        avatar_url: newAvatarUrl,
      },
    });

    if (error) {
      setError("Error updating profile");
    } else {
      setEditing(false);
    }
    setIsLoading(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleFollowChange = (isFollowing: boolean) => {
    setFollowersCount((prevCount) => (isFollowing ? prevCount + 1 : prevCount - 1));
  };

  const handleSignout = async () => {
    await supabase.auth.signOut();
    push("/login");
  };
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div className="flex justify-center mb-4">
        <div className="relative">
          <img
            src={avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl || "https://via.placeholder.com/150"}
            alt={profileProps.profile.displayname}
            className="w-32 h-32 rounded-full object-cover"
          />
          {editing && (
            <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          )}
        </div>
      </div>
      {editing ? (
        <div className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            rows={3}
          />
          {error && <p className="text-red-500">{error}</p>}
          <button onClick={handleSave} disabled={isLoading} className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50">
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{profileProps.profile.displayname}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">{profileProps.profile.fullname}</p>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{bio}</p>
          <div className="flex justify-center space-x-4 mb-4">
            <Link href={`/profile/${profileProps.profile.displayname}/followers`} className="text-blue-500">
              <p className="font-bold">{followersCount}</p> <p>followers</p>
            </Link>
            <Link href={`/profile/${profileProps.profile.displayname}/following`} className="text-blue-500">
              <p className="font-bold">{followingCount}</p> <p>following</p>
            </Link>
          </div>
          {profileProps.isOwnProfile ? (
            <>
              {profileProps.isGuest ? (
                <p className="text-gray-500 dark:text-gray-400">Guest users cannot edit their profile</p>
              ) : (
                <button onClick={() => setEditing(true)} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded">
                  Edit Profile
                </button>
              )}
              <button onClick={() => handleSignout()} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded m-2">
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex justify-center space-x-4">
              <FollowButton
                currentUserId={profileProps.currentUserId}
                targetUserId={profileProps.profile.id}
                onFollowChange={handleFollowChange}
                isGuest={profileProps.isGuest}
              />
              <Link href={`/messages/${profileProps.profile.displayname}`}>
                <button className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded m-2">Chat</button>
              </Link>
            </div>
          )}
        </div>
      )}

      <ProfilePostList user_id={profileProps.profile.id} isGuest={profileProps.isGuest} />
    </div>
  );
}
