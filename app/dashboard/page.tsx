"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Upload, Plus, Sparkles, ShoppingBag, Loader2 } from "lucide-react";

const CLOSET_TYPES = ["top", "bottom", "dress", "shoes", "outerwear"];

const WOMEN_DEMO_ITEMS = [
  {
    imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400",
    label: "Silk Blush Blouse",
    type: "top",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1551733592-220209dd043d?w=400",
    label: "Flowy Floral Skirt",
    type: "bottom",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400",
    label: "Summer Sundress",
    type: "dress",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400",
    label: "Rose Gold Heels",
    type: "shoes",
  },
];

export default function Dashboard() {
  const userId = "demo";
  const items = useQuery(api.closet.listClosetItems, { userId });
  const addItem = useMutation(api.closet.addClosetItem);
  const generateUploadUrl = useMutation(api.closet.generateUploadUrl);

  const [label, setLabel] = useState("");
  const [type, setType] = useState("top");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    
    setIsSubmitting(true);
    try {
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        setUploadError("Please select a file first");
        setIsSubmitting(false);
        return;
      }

      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();
      
      await addItem({ userId, imageUrl: storageId, label, type });
      
      setLabel("");
      setType("top");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("An error occurred while uploading. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadDemo = async () => {
    for (const item of WOMEN_DEMO_ITEMS) {
      await addItem({ userId, ...item });
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 p-8 text-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-pink-600 w-8 h-8" />
            <h1 className="text-3xl font-bold text-pink-900">My Chic Closet</h1>
          </div>
          <button
            onClick={loadDemo}
            className="flex items-center gap-2 px-4 py-2 bg-pink-200 hover:bg-pink-300 text-pink-900 rounded-full transition-colors font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Load Style Demo
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border-pink-100 border-2 sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-pink-800 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add New Piece
              </h2>
              
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-pink-700 mb-1">
                    Choose Photo
                  </label>
                  <div 
                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors bg-pink-50/50 relative ${uploadError ? 'border-red-300 bg-red-50' : 'border-pink-200 hover:border-pink-400'} ${isSubmitting ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    {isSubmitting ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
                        <p className="text-xs text-pink-600 font-medium">Uploading piece...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className={`w-8 h-8 mx-auto mb-2 ${uploadError ? 'text-red-400' : 'text-pink-400'}`} />
                        <p className={`text-xs font-medium ${uploadError ? 'text-red-600' : 'text-pink-600'}`}>
                          {fileInputRef.current?.files?.[0]?.name || "Click to upload image"}
                        </p>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={() => setUploadError(null)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                
                {uploadError && (
                  <p className="text-xs text-red-600 font-medium px-1">{uploadError}</p>
                )}

                <div>
                  <label className="block text-sm font-medium text-pink-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Favorite Pink Dress"
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border-pink-200 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none disabled:bg-pink-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-pink-700 mb-1">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border-pink-200 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white disabled:bg-pink-50"
                  >
                    {CLOSET_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white rounded-xl font-bold shadow-md shadow-pink-100 transition-all transform active:scale-95 flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding Piece...
                    </>
                  ) : (
                    "Add to Chic Closet"
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 text-pink-900">Your Boutique</h2>
            {!items ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="aspect-[3/4] bg-pink-100 animate-pulse rounded-2xl"></div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white p-16 rounded-2xl border-2 border-dashed border-pink-100 text-center">
                <p className="text-pink-400 font-medium">Your boutique is empty. Start adding your style!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {items.map((item) => (
                  <div key={item._id} className="bg-white rounded-2xl shadow-sm border-pink-50 border overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="aspect-[3/4] relative bg-pink-50 flex items-center justify-center">
                      <img
                        src={item.imageUrl}
                        alt={item.label || "Closet item"}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Invalid+Image";
                        }}
                      />
                    </div>
                    <div className="p-4 bg-white">
                      <p className="font-bold text-pink-900 text-sm truncate">
                        {item.label || "Untitled Style"}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="px-3 py-1 bg-pink-50 text-pink-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          {item.type}
                        </span>
                        <span className="text-[10px] text-pink-300">New</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
