"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from "uuid";
import { Image, X } from "lucide-react";

export default function CreatePost() {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("User not found");
      setIsLoading(false);
      return;
    }

    let imageUrl = null;

    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage.from("post-images").upload(`${user!.id}/${fileName}`, image);

      if (uploadError) {
        setError("Error uploading image");
        setIsLoading(false);
        return;
      }

      imageUrl = data.path;
    }

    const { error } = await supabase.from("posts").insert({ content, user_id: user.id, image_url: imageUrl });

    if (error) {
      setError("Error creating post");
    } else {
      setContent("");
      setImage(null);
      setPreview(null);
    }

    setIsLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        rows={3}
      />
      <div className="flex items-center space-x-2">
        <label htmlFor="image-upload" className="cursor-pointer">
          <Image size={24} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200" />
          <span className="sr-only">Upload image</span>
        </label>
        <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading || (!content.trim() && !image)}
          className="ml-auto bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-blue-600 transition duration-200"
        >
          {isLoading ? "Posting..." : "Post"}
        </button>
      </div>
      {preview && (
        <div className="relative">
          <img src={preview} alt="Preview" className="mt-2 rounded-lg h-[500px] w-full object-cover" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75 transition duration-200"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </form>
  );
}
