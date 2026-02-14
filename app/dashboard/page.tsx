"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSearchParams } from "next/navigation";
import { Plus, Sparkles, ShoppingBag, Loader2, Cloud, Wind, Thermometer, Zap, History, UserCircle, Save, Image as ImageIcon } from "lucide-react";

const OCCASIONS = ["Work", "Date", "Casual", "Party"];

export default function Dashboard() {
  const userId = "demo";
  const profilePhotoUrl = useQuery(api.profile.getProfilePhoto, { userId });
  const upsertProfile = useMutation(api.profile.upsertProfilePhoto);
  const generateOutfits = useAction(api.outfits.generateTop3OutfitsWithTryOn);
  const history = useQuery(api.outfits.listHistory, { userId });

  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [occasion, setOccasion] = useState("Casual");
  const [mood, setMood] = useState(50);
  const [isBloated, setIsBloated] = useState(false);
  const [city, setCity] = useState("San Francisco");
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  
  const [results, setResults] = useState<any[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
    if (profilePhotoUrl) setPhotoUrlInput(profilePhotoUrl);
  }, [profilePhotoUrl]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await upsertProfile({ userId, photoUrl: photoUrlInput });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRecommend = async () => {
    setIsGenerating(true);
    try {
      const data = await generateOutfits({
        userId,
        occasion,
        mood,
        bodyState: isBloated ? "bloated" : "normal",
        weatherSummary: weather ? `${weather.temp}°F, ${weather.condition}` : "Unknown weather",
      });
      setResults(data);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 p-8 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-pink-600 w-8 h-8" />
            <h1 className="text-3xl font-bold text-pink-900">FitSense Dashboard</h1>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-pink-100 border-2 flex flex-col md:flex-row gap-6 items-center">
          <div className="w-24 h-24 rounded-full bg-pink-100 border-2 border-pink-200 overflow-hidden flex-shrink-0">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-full h-full text-pink-300" />
            )}
          </div>
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-semibold text-pink-700">Profile Photo URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={photoUrlInput}
                onChange={(e) => setPhotoUrlInput(e.target.value)}
                placeholder="Paste your photo URL here..."
                className="flex-1 px-4 py-2 border-pink-200 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:outline-none text-sm"
              />
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="px-4 py-2 bg-pink-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-pink-700 disabled:bg-pink-300 transition-colors"
              >
                {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Context Column */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border-pink-100 border-2 space-y-6">
              <h2 className="text-xl font-semibold text-pink-800 flex items-center gap-2">
                <Cloud className="w-5 h-5" /> Today's Context
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-pink-700 mb-1">Occasion</label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full px-3 py-2 border-pink-200 border rounded-lg bg-white"
                  >
                    {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label className="flex justify-between text-sm font-medium text-pink-700 mb-1">
                    Mood <span>{mood}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={mood}
                    onChange={(e) => setMood(parseInt(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-pink-700 mb-1">Body State</label>
                  <div className="flex p-1 bg-pink-50 rounded-xl border border-pink-100">
                    <button
                      onClick={() => setIsBloated(false)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isBloated ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400'}`}
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => setIsBloated(true)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isBloated ? 'bg-pink-600 text-white shadow-sm' : 'text-gray-400'}`}
                    >
                      Bloated
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-pink-50 flex gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="flex-1 px-3 py-2 border-pink-200 border rounded-lg text-sm"
                  />
                  <button onClick={fetchWeather} className="p-2 bg-pink-100 rounded-lg text-pink-700">
                    {isWeatherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleRecommend}
                disabled={isGenerating}
                className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold shadow-lg flex justify-center items-center gap-2 hover:bg-pink-700 disabled:bg-pink-300 transition-all active:scale-95"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Recommend Top 3
              </button>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-xl font-semibold text-pink-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-pink-600" /> AI Suggestions
            </h2>
            
            {!profilePhotoUrl && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-800 text-sm flex gap-2">
                <ImageIcon className="w-5 h-5 flex-shrink-0" />
                <p>Add a profile photo URL above to see yourself wearing these outfits!</p>
              </div>
            )}

            {isGenerating ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-4 rounded-2xl border-2 border-pink-100 space-y-4 animate-pulse">
                    <div className="aspect-[3/4] bg-pink-100 rounded-xl" />
                    <div className="h-4 bg-pink-100 rounded w-3/4" />
                    <div className="h-3 bg-pink-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : results ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {results.map((res, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border-2 border-pink-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-pink-50 flex items-center justify-center border border-pink-50 relative group">
                      {res.tryOnImageBase64 ? (
                        <img 
                          src={`data:image/jpeg;base64,${res.tryOnImageBase64}`} 
                          alt={res.outfitText} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-pink-200 flex flex-col items-center p-4 text-center gap-2">
                          <ImageIcon className="w-12 h-12" />
                          <p className="text-[10px] uppercase font-bold tracking-tighter">Preview Unavailable</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-pink-900 leading-tight">{res.outfitText}</h3>
                      <p className="text-xs text-gray-500 italic leading-relaxed line-clamp-2">{res.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-pink-100 text-center flex flex-col items-center gap-4">
                <Sparkles className="w-12 h-12 text-pink-200" />
                <p className="text-pink-400 font-medium">Ready for your daily style inspiration?</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
