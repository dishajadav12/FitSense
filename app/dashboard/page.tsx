"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSearchParams } from "next/navigation";
import { Plus, Sparkles, ShoppingBag, Loader2, Cloud, Image as ImageIcon, Upload, Shirt } from "lucide-react";

const OCCASIONS = ["Work", "Date", "Casual", "Party"];
const CLOSET_TYPES = ["top", "bottom", "dress", "shoes", "outerwear"];

const WOMEN_DEMO_ITEMS = [
  { imageUrl: "/demo/silk-blush-blouse.jpg", label: "Black Structured Jacket", type: "outerwear" },
  { imageUrl: "/demo/flowy-floral-skirt.jpg", label: "Off-Shoulder Knit Top", type: "top" },
  { imageUrl: "/demo/summer-sundress.jpg", label: "Lavender A-Line Dress", type: "dress" },
  { imageUrl: "/demo/rose-gold-heels.jpg", label: "Turquoise Patent Heels", type: "shoes" },
  { imageUrl: "/demo/cozy-wool-sweater.jpg", label: "Striped Knit Sweater", type: "top" },
  { imageUrl: "/demo/elegant-maxi-dress.jpg", label: "Purple Evening Gown", type: "dress" },
  { imageUrl: "/demo/white-linen-shirt.jpg", label: "Magenta Plaid Flannel", type: "top" },
  { imageUrl: "/demo/classic-denim-jeans.jpg", label: "Classic Blue Jeans", type: "bottom" },
  { imageUrl: "/demo/black-midi-skirt.jpg", label: "Black Lace Blouse", type: "top" },
  { imageUrl: "/demo/pastel-satin-slip.jpg", label: "Coral Flowing Gown", type: "dress" },
  { imageUrl: "/demo/tailored-beige-blazer.jpg", label: "Grey Tweed Jacket", type: "outerwear" },
  { imageUrl: "/demo/ruffled-wrap-top.jpg", label: "Gold Embellished Top", type: "top" },
  { imageUrl: "/demo/wide-leg-trousers.jpg", label: "Black Jogger Pants", type: "bottom" },
  { imageUrl: "/demo/boho-chic-kimono.jpg", label: "Beige Open Cardigan", type: "outerwear" },
  { imageUrl: "/demo/white-fashion-sneakers.jpg", label: "Tan Suede Sneakers", type: "shoes" },
  { imageUrl: "/demo/beige-wide-pants.jpg", label: "Black Zip Joggers", type: "bottom" },
  { imageUrl: "/demo/pleated-midi-skirt.jpg", label: "Striped Lace T-Shirt", type: "top" },
];

export default function Dashboard() {
  const userId = "demo";
  const generateOutfits = useAction(api.outfits.generateTop3OutfitsWithTryOn);
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
  const [label, setLabel] = useState("");
  const [type, setType] = useState("top");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedStorageId, setUploadedStorageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [analysisStatus, setAnalysisStatus] = useState("");

  const handleRecommend = async () => {
    setIsGenerating(true);
    setAnalysisStatus("");
    try {
      let itemDescriptions: Record<string, string> = {};

      if (items && items.length > 0) {
        setAnalysisStatus("Scanning your wardrobe with AI vision...");
        try {
          const origin = window.location.origin;
          const analyzePayload = items.map((item) => {
            let url = item.imageUrl ?? "";
            if (url.startsWith("/")) url = origin + url;
            return {
              id: item._id,
              imageUrl: url,
              type: item.type ?? "unknown",
              label: item.label ?? "item",
            };
          });
          const analyzeRes = await fetch("/api/analyze-closet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: analyzePayload }),
          });
          if (analyzeRes.ok) {
            const analyzeData = await analyzeRes.json();
            itemDescriptions = analyzeData.descriptions || {};
          }
        } catch (err) {
          console.error("Gemini analysis failed, continuing without:", err);
        }
      }

      setAnalysisStatus("Creating outfits with your items...");
      const data = await generateOutfits({
        userId,
        occasion,
        mood,
        bodyState: isBloated ? "bloated" : "normal",
        weatherSummary: weather ? `${weather.temp}°F, ${weather.condition}` : "Unknown weather",
        itemDescriptions,
      });
      setResults(data);
      setAnalysisStatus("");
    } finally {
      setIsGenerating(false);
      setAnalysisStatus("");
    }
  };

  const loadDemo = async () => {
    for (const item of WOMEN_DEMO_ITEMS) {
      await addItem({ userId, ...item });
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
      await addItem({ userId, imageUrl: uploadedStorageId, label, type });
      setLabel("");
      setUploadedStorageId(null);
      setView("default");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getItemById = (id: string) => items?.find(item => item._id === id);

  return (
    <div className="min-h-screen bg-pink-50 p-8 text-gray-900">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-pink-600 w-8 h-8" />
            <h1 className="text-3xl font-bold text-pink-900" data-testid="text-dashboard-title">FitSense Dashboard</h1>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setView(view === "add" ? "default" : "add")}
              className={`px-4 py-2 rounded-full transition-colors font-medium border-2 ${view === "add" ? 'bg-white border-pink-200 text-pink-600' : 'bg-pink-600 border-pink-600 text-white'}`}
              data-testid="button-toggle-add"
            >
              {view === "add" ? "Back" : "Add Piece"}
            </button>
            <button onClick={loadDemo} className="flex items-center gap-2 px-4 py-2 bg-pink-200 hover:bg-pink-300 text-pink-900 rounded-full font-medium" data-testid="button-load-demo">
              <Sparkles className="w-4 h-4" /> Load Demo Closet
            </button>
          </div>
        </div>

        {view === "add" ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border-pink-100 border-2 space-y-6">
              <h2 className="text-2xl font-bold text-pink-800 flex items-center gap-2"><Plus className="w-6 h-6" /> Add Piece</h2>
              <form onSubmit={handleAddPiece} className="space-y-4">
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-pink-200 rounded-xl p-8 text-center cursor-pointer hover:bg-pink-50 transition-colors" data-testid="button-upload-garment">
                  {isUploading ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-400" /> : <Upload className="w-8 h-8 mx-auto text-pink-400 mb-2" />}
                  <p className="text-sm text-pink-600">{uploadedStorageId ? "Image Selected" : "Click to upload garment"}</p>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleClosetFileChange} data-testid="input-garment-file" />
                </div>
                <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Item label (e.g. Silk Blouse)" className="w-full px-4 py-3 border-pink-200 border rounded-xl" data-testid="input-item-label" />
                <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-3 border-pink-200 border rounded-xl bg-white" data-testid="select-item-type">
                  {CLOSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="submit" disabled={isSubmitting || !uploadedStorageId} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold disabled:bg-pink-200 transition-all" data-testid="button-save-closet">
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
                    <select value={occasion} onChange={e => setOccasion(e.target.value)} className="w-full px-3 py-2 border-pink-200 border rounded-lg bg-white" data-testid="select-occasion">
                      {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="flex justify-between text-sm font-medium text-pink-700">Mood <span>{mood}%</span></label>
                    <input type="range" min="0" max="100" value={mood} onChange={e => setMood(parseInt(e.target.value))} className="w-full accent-pink-500" data-testid="input-mood" />
                  </div>
                  <div className="flex p-1 bg-pink-50 rounded-xl border border-pink-100">
                    <button onClick={() => setIsBloated(false)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isBloated ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-400'}`} data-testid="button-normal">Normal</button>
                    <button onClick={() => setIsBloated(true)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isBloated ? 'bg-pink-600 text-white shadow-sm' : 'text-gray-400'}`} data-testid="button-bloated">Bloated</button>
                  </div>
                  <div className="flex gap-2">
                    <input value={city} onChange={e => setCity(e.target.value)} className="flex-1 px-3 py-2 border-pink-200 border rounded-lg text-sm" data-testid="input-city" />
                    <button onClick={fetchWeather} className="p-2 bg-pink-100 rounded-lg text-pink-700" data-testid="button-fetch-weather">
                      {isWeatherLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button onClick={handleRecommend} disabled={isGenerating} className="w-full py-4 bg-pink-600 text-white rounded-2xl font-bold shadow-lg flex flex-col justify-center items-center gap-1 hover:bg-pink-700 disabled:bg-pink-300 transition-all active:scale-95" data-testid="button-generate">
                  <span className="flex items-center gap-2">
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Generate Outfits
                  </span>
                  {isGenerating && analysisStatus && (
                    <span className="text-xs font-normal opacity-80">{analysisStatus}</span>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <h2 className="text-xl font-semibold text-pink-900 flex items-center gap-2"><Sparkles className="w-6 h-6 text-pink-600" /> AI Outfit Picks</h2>
              {results ? (
                <div className="space-y-6">
                  {results.map((res, i) => {
                    const selectedItems = (res.selectedItemIds || [])
                      .map((id: string) => getItemById(id))
                      .filter(Boolean);

                    return (
                      <div key={i} className="bg-white rounded-2xl border-2 border-pink-100 shadow-sm overflow-hidden" data-testid={`card-outfit-${i}`}>
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-64 flex-shrink-0 bg-pink-50">
                            {res.tryOnImageBase64 ? (
                              <img src={`data:image/jpeg;base64,${res.tryOnImageBase64}`} alt={res.outfitText} className="w-full h-full object-cover aspect-[3/4] md:aspect-auto" />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-6 text-center">
                                <ImageIcon className="w-10 h-10 text-pink-200 mb-2" />
                                <p className="text-xs text-pink-300 font-medium">Try-on image</p>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 p-5 space-y-4">
                            <div>
                              <h3 className="font-bold text-pink-900 text-lg" data-testid={`text-outfit-name-${i}`}>{res.outfitText}</h3>
                              <p className="text-sm text-gray-500 italic mt-1">{res.reason}</p>
                            </div>

                            {selectedItems.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <Shirt className="w-3 h-3" /> From your closet
                                </p>
                                <div className="flex gap-3 flex-wrap">
                                  {selectedItems.map((item: any) => (
                                    <div key={item._id} className="flex items-center gap-2 bg-pink-50 rounded-xl p-2 pr-3" data-testid={`pill-item-${item._id}`}>
                                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-pink-100 flex-shrink-0">
                                        <img src={item.imageUrl} alt={item.label || ""} className="w-full h-full object-cover" />
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-pink-900 leading-tight">{item.label}</p>
                                        <p className="text-[10px] text-pink-400 uppercase">{item.type}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                    <div key={item._id} className="bg-white rounded-xl shadow-sm border border-pink-50 overflow-hidden" data-testid={`card-closet-${item._id}`}>
                      <div className="aspect-[3/4] relative bg-pink-50">
                        <img src={item.imageUrl ?? ""} alt={item.label ?? ""} className="w-full h-full object-cover" />
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
