"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSearchParams } from "next/navigation";
import { Plus, Sparkles, ShoppingBag, Loader2, Cloud, Wind, Thermometer, Zap, History, UserCircle, Save, Image as ImageIcon, Upload } from "lucide-react";

const OCCASIONS = ["Work", "Date", "Casual", "Party"];
const CLOSET_TYPES = ["top", "bottom", "dress", "shoes", "outerwear"];

const WOMEN_DEMO_ITEMS = [
  { imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400", label: "Silk Blush Blouse", type: "top" },
  { imageUrl: "https://images.unsplash.com/photo-1551733592-220209dd043d?w=400", label: "Flowy Floral Skirt", type: "bottom" },
  { imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400", label: "Summer Sundress", type: "dress" },
  { imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400", label: "Rose Gold Heels", type: "shoes" },
  { imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400", label: "Cozy Wool Sweater", type: "top" },
  { imageUrl: "https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=400", label: "Elegant Maxi Dress", type: "dress" },
  { imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400", label: "White Linen Shirt", type: "top" },
  { imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400", label: "Classic Denim Jeans", type: "bottom" },
  { imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400", label: "Black Midi Skirt", type: "bottom" },
  { imageUrl: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=400", label: "Pastel Satin Slip", type: "dress" },
  { imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400", label: "Tailored Beige Blazer", type: "outerwear" },
  { imageUrl: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=400", label: "Ruffled Wrap Top", type: "top" },
  { imageUrl: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400", label: "Wide Leg Trousers", type: "bottom" },
  { imageUrl: "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=400", label: "Boho Chic Kimono", type: "outerwear" },
  { imageUrl: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400", label: "White Fashion Sneakers", type: "shoes" },
];

export default function Dashboard() {
  const userId = "demo";
  const profilePhotoUrl = useQuery(api.profile.getProfilePhoto, { userId });
  const upsertProfile = useMutation(api.profile.upsertProfilePhoto);
  const getProfileUploadUrl = useMutation(api.profile.getUploadUrl);
  const generateOutfits = useAction(api.outfits.generateTop3OutfitsWithTryOn);
  const history = useQuery(api.outfits.listHistory, { userId });
  const items = useQuery(api.closet.listClosetItems, { userId });
  const addItem = useMutation(api.closet.addClosetItem);
  const getClosetUploadUrl = useMutation(api.closet.generateUploadUrl);

  const searchParams = useSearchParams();
  const [view, setView] = useState<"default" | "add">(searchParams.get("view") === "add" ? "add" : "default");
  const [occasion, setOccasion] = useState("Casual");
  const [mood, setMood] = useState(50);
  const [isBloated, setIsBloated] = useState(false);
  const [city, setCity] = useState("San Francisco");
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  
  const [results, setResults] = useState<any[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Closet Add State
  const [label, setLabel] = useState("");
  const [type, setType] = useState("top");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedStorageId, setUploadedStorageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

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

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSavingProfile(true);
    try {
      const postUrl = await getProfileUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Upload failed");

      const { storageId } = await result.json();
      await upsertProfile({ userId, photoUrl: storageId });
    } catch (err) {
      console.error("Profile upload error:", err);
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

  const loadDemo = async () => {
    for (const item of WOMEN_DEMO_ITEMS) {
      await addItem({ userId, ...item, createdAt: Date.now() });
    }
  };

  const handleClosetFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const postUrl = await getClosetUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      setUploadedStorageId(storageId);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPiece = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedStorageId) return;
    setIsSubmitting(true);
    try {
      await addItem({ userId, imageUrl: uploadedStorageId, label, type, createdAt: Date.now() });
      setLabel("");
      setUploadedStorageId(null);
      setView("default");
    } finally {
      setIsSubmitting(false);
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
          <div className="flex gap-3">
            <button
              onClick={() => setView(view === "add" ? "default" : "add")}
              className={`px-4 py-2 rounded-full transition-colors font-medium border-2 ${view === "add" ? 'bg-white border-pink-200 text-pink-600' : 'bg-pink-600 border-pink-600 text-white'}`}
            >
              {view === "add" ? "Back" : "Add Piece"}
            </button>
            <button onClick={loadDemo} className="flex items-center gap-2 px-4 py-2 bg-pink-200 hover:bg-pink-300 text-pink-900 rounded-full font-medium">
              <Sparkles className="w-4 h-4" /> Load 15 Items
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-pink-100 border-2 flex flex-col md:flex-row gap-6 items-center">
          <div className="w-24 h-24 rounded-full bg-pink-100 border-2 border-pink-200 overflow-hidden flex-shrink-0 relative group cursor-pointer" onClick={() => profileInputRef.current?.click()}>
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-full h-full text-pink-300" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Upload className="text-white w-6 h-6" />
            </div>
            <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={handleProfileUpload} />
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-lg font-bold text-pink-900">Your Style Profile</h2>
            <p className="text-sm text-pink-600">Upload a full-body photo from your device to enable AI Try-On.</p>
            {isSavingProfile && <div className="flex items-center gap-2 text-xs text-pink-500 font-bold animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> Uploading profile...</div>}
          </div>
        </div>

        {view === "add" ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border-pink-100 border-2 space-y-6">
              <h2 className="text-2xl font-bold text-pink-800 flex items-center gap-2"><Plus className="w-6 h-6" /> Add Piece</h2>
              <form onSubmit={handleAddPiece} className="space-y-4">
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-pink-200 rounded-xl p-8 text-center cursor-pointer hover:bg-pink-50 transition-colors">
                  {isUploading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-400" /> : <Upload className="w-8 h-8 mx-auto text-pink-400 mb-2" />}
                  <p className="text-sm text-pink-600">{uploadedStorageId ? "Image Selected" : "Click to upload garment"}</p>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleClosetFileChange} />
                </div>
                <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Item label (e.g. Silk Blouse)" className="w-full px-4 py-3 border-pink-200 border rounded-xl" />
                <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-3 border-pink-200 border rounded-xl bg-white">
                  {CLOSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="submit" disabled={isSubmitting || !uploadedStorageId} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold disabled:bg-pink-200 transition-all">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save to Closet"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border-pink-100 border-2 space-y-6">
                <h2 className="text-xl font-semibold text-pink-800 flex items-center gap-2"><Cloud className="w-5 h-5" /> Context</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-pink-700">Occasion</label>
                    <select value={occasion} onChange={e => setOccasion(e.target.value)} className="w-full px-3 py-2 border-pink-200 border rounded-lg bg-white">
                      {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="flex justify-between text-sm font-medium text-pink-700">Mood <span>{mood}%</span></label>
                    <input type="range" min="0" max="100" value={mood} onChange={e => setMood(parseInt(e.target.value))} className="w-full accent-pink-500" />
                  </div>
                  <div className="flex p-1 bg-pink-50 rounded-xl border border-pink-100">
                    <button onClick={() => setIsBloated(false)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isBloated ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400'}`}>Normal</button>
                    <button onClick={() => setIsBloated(true)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isBloated ? 'bg-pink-600 text-white shadow-sm' : 'text-gray-400'}`}>Bloated</button>
                  </div>
                  <div className="flex gap-2">
                    <input value={city} onChange={e => setCity(e.target.value)} className="flex-1 px-3 py-2 border-pink-200 border rounded-lg text-sm" />
                    <button onClick={fetchWeather} className="p-2 bg-pink-100 rounded-lg text-pink-700">
                      {isWeatherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button onClick={handleRecommend} disabled={isGenerating} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold shadow-lg flex justify-center items-center gap-2 hover:bg-pink-700 disabled:bg-pink-300 transition-all active:scale-95">
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Generate Try-Ons
                </button>
              </div>

              {history && history.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border-pink-100 border-2">
                  <h2 className="text-xl font-semibold mb-4 text-pink-800 flex items-center gap-2"><History className="w-5 h-5" /> History</h2>
                  <div className="space-y-4">
                    {history.map(h => (
                      <div key={h._id} className="p-3 bg-pink-50/30 rounded-xl text-xs">
                        <p className="font-bold text-pink-900">{h.results?.[0]?.outfitText || "Past Look"}</p>
                        <p className="text-pink-600 mt-1 italic">{h.occasion} • {h.weatherSummary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-8">
              <h2 className="text-xl font-semibold text-pink-900 flex items-center gap-2"><Sparkles className="w-6 h-6 text-pink-600" /> AI Suggestions</h2>
              {results ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {results.map((res, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border-2 border-pink-100 shadow-sm flex flex-col gap-4">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-pink-50 border border-pink-50">
                        {res.tryOnImageBase64 ? (
                          <img src={`data:image/jpeg;base64,${res.tryOnImageBase64}`} alt={res.outfitText} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-pink-200 flex flex-col items-center justify-center h-full p-4 text-center">
                            <ImageIcon className="w-8 h-8 mb-2" />
                            <p className="text-[10px] font-bold">Image Generating...</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-pink-900 text-sm leading-tight">{res.outfitText}</h3>
                        <p className="text-[10px] text-gray-500 italic mt-1 line-clamp-2">{res.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-20 rounded-2xl border-2 border-dashed border-pink-100 text-center flex flex-col items-center gap-4">
                  <Sparkles className="w-12 h-12 text-pink-200" />
                  <p className="text-pink-400 font-medium italic">Your personalized lookbook is waiting...</p>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold mb-4 text-pink-900">Your Boutique</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {items?.map(item => (
                    <div key={item._id} className="bg-white rounded-xl shadow-sm border border-pink-50 overflow-hidden">
                      <div className="aspect-[3/4] relative bg-pink-50">
                        <img src={item.imageUrl} alt={item.label} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2 bg-white">
                        <p className="font-bold text-pink-900 text-[10px] truncate">{item.label}</p>
                        <span className="text-[8px] font-bold text-pink-400 uppercase tracking-widest">{item.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
