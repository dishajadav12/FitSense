"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Upload, Plus, Sparkles, ShoppingBag, Loader2, Cloud, Wind, Thermometer, User, Coffee, Zap } from "lucide-react";

const CLOSET_TYPES = ["top", "bottom", "dress", "shoes", "outerwear"];
const OCCASIONS = ["Work", "Date", "Casual", "Party"];

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

  // Closet State
  const [label, setLabel] = useState("");
  const [type, setType] = useState("top");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedStorageId, setUploadedStorageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Context State
  const [occasion, setOccasion] = useState("Casual");
  const [mood, setMood] = useState(50);
  const [isBloated, setIsBloated] = useState(false);
  const [city, setCity] = useState("San Francisco");
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  const fetchWeather = async () => {
    setIsWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      setWeather({ temp: data.temp, condition: data.condition });
    } catch (err) {
      setWeather({ temp: 60, condition: "Cloudy" });
    } finally {
      setIsWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    setUploadedStorageId(null);

    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();
      setUploadedStorageId(storageId);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("Failed to upload image. Please try again.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedStorageId) {
      setUploadError("Please upload an image first");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addItem({ userId, imageUrl: uploadedStorageId, label, type });
      setLabel("");
      setType("top");
      setUploadedStorageId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Add item error:", err);
      setUploadError("Failed to add piece. Please try again.");
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
          {/* Left Column: Context & Closet Form */}
          <div className="lg:col-span-1 space-y-8">
            {/* Today's Context Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-pink-100 border-2">
              <h2 className="text-xl font-semibold mb-4 text-pink-800 flex items-center gap-2">
                <Cloud className="w-5 h-5" /> Today's Context
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-pink-700 mb-1">Occasion</label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full px-3 py-2 border-pink-200 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
                  >
                    {OCCASIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-pink-700 italic">Mood</label>
                    <span className="text-xs font-bold text-pink-600">{mood}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={mood}
                    onChange={(e) => setMood(parseInt(e.target.value))}
                    className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <div className="flex justify-between mt-1 px-1">
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Comfy</span>
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Confident</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-pink-50/50 rounded-xl border border-pink-100">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${isBloated ? 'text-pink-500' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-pink-700">Body State</span>
                  </div>
                  <button
                    onClick={() => setIsBloated(!isBloated)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${isBloated ? 'bg-pink-500 text-white shadow-sm shadow-pink-200' : 'bg-white text-gray-400 border border-gray-200'}`}
                  >
                    {isBloated ? 'Bloated' : 'Normal'}
                  </button>
                </div>

                <div className="pt-2 border-t border-pink-50">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City..."
                      className="flex-1 px-3 py-2 border-pink-200 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:outline-none"
                    />
                    <button
                      onClick={fetchWeather}
                      disabled={isWeatherLoading}
                      className="px-3 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 rounded-lg transition-colors"
                    >
                      {isWeatherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                    </button>
                  </div>
                  {weather && (
                    <div className="mt-2 flex items-center justify-center gap-4 py-2 bg-blue-50/50 rounded-lg text-blue-700 border border-blue-100">
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 opacity-70" />
                        <span className="text-xs font-bold">{weather.temp}°F</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wind className="w-3 h-3 opacity-70" />
                        <span className="text-xs font-bold uppercase tracking-widest">{weather.condition}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Add Closet Item Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-pink-100 border-2">
              <h2 className="text-xl font-semibold mb-4 text-pink-800 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add New Piece
              </h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div 
                  onClick={() => !isUploading && !isSubmitting && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors bg-pink-50/50 relative ${uploadError ? 'border-red-300 bg-red-50' : 'border-pink-200 hover:border-pink-400'} ${(isUploading || isSubmitting) ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
                      <p className="text-xs text-pink-600 font-medium">Uploading to boutique...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${uploadError ? 'text-red-400' : 'text-pink-400'}`} />
                      <p className={`text-xs font-medium ${uploadError ? 'text-red-600' : 'text-pink-600'}`}>
                        {uploadedStorageId ? "Image Selected" : (fileInputRef.current?.files?.[0]?.name || "Click to upload image")}
                      </p>
                      {uploadedStorageId && (
                        <p className="text-[10px] text-green-600 mt-1 font-bold italic">Upload ready!</p>
                      )}
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading || isSubmitting}
                  />
                </div>
                {uploadError && <p className="text-xs text-red-600 font-medium px-1">{uploadError}</p>}
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Label (e.g. Favorite Silk Dress)"
                  className="w-full px-3 py-2 border-pink-200 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border-pink-200 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
                >
                  {CLOSET_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading || !uploadedStorageId}
                  className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white rounded-xl font-bold shadow-md shadow-pink-100 transition-all transform active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Add to Chic Closet"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Closet Grid & Outfit Result Placeholder */}
          <div className="lg:col-span-2 space-y-8">
            {/* Outfit Result Placeholder */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border-pink-100 border-2">
              <h2 className="text-xl font-semibold mb-4 text-pink-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> AI Outfit Suggestion
              </h2>
              <div className="h-48 bg-pink-50/30 rounded-2xl border-2 border-dashed border-pink-100 flex flex-col items-center justify-center text-pink-300 p-8 text-center">
                <p className="font-medium italic mb-2">"Based on your {occasion.toLowerCase()} occasion and {weather?.condition.toLowerCase() || 'cloudy'} weather..."</p>
                <p className="text-xs opacity-60">Recommendation logic coming in the next step!</p>
              </div>
            </div>

            {/* Closet Grid */}
            <div>
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
    </div>
  );
}
