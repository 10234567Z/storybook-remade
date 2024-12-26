"use client";

import { FormEvent, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

interface User {
  id: string;
  displayname: string;
  avatarurl: string;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const supabase = createClientComponentClient();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from("users").select("id, displayname, avatarurl").ilike("displayname", `%${query}%`).limit(10);

    if (error) {
      console.error("Error searching users:", error);
    } else {
      for (const user of data) {
        if (user.avatarurl) {
          const { data: avaData, error: avaError } = await supabase.storage.from("avatar-images").createSignedUrl(user.avatarurl, 3600);
          if (avaError) {
            console.error("Error fetching signed url:", avaError);
          } else {
            user.avatarurl = avaData.signedUrl;
          }
        }
      }
      setResults(data);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Search Users</h1>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
          className="flex-grow p-2 border rounded dark:bg-gray-700 dark:text-white"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Search
        </button>
      </form>
      <div className="space-y-2">
        {results.map((user) => (
          <Link key={user.id} href={`/profile/${user.displayname}`} className="flex items-center p-2 bg-white dark:bg-gray-800 rounded-lg shadow">
            <img src={user.avatarurl || "https://via.placeholder.com/40"} alt={user.displayname} className="w-10 h-10 rounded-full mr-2" />
            <span className="text-gray-800 dark:text-white">{user.displayname}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
