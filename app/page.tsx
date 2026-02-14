"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ShoppingBag, Sparkles, UserCircle, Upload, Loader2, History, Camera, ChevronDown, ChevronUp, ImageIcon, Eye, Shirt, Wand2, Sun, Heart } from "lucide-react";

const USER_ID = "demo";

export default function Home() {
  const profile = useQuery(api.profile.getProfile, { userId: USER_ID });
  const upsertProfile = useMutation(api.profile.upsertProfile);
  const getUploadUrl = useMutation(api.profile.getUploadUrl);
  const history = useQuery(api.outfits.listHistory, { userId: USER_ID });

  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const isOnboarded = profile && profile.name;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const postUrl = await getUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      await upsertProfile({ userId: USER_ID, photoUrl: storageId });
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setIsUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    setSaveError("");
    try {
      await upsertProfile({ userId: USER_ID, name: name.trim() });
    } catch (err) {
      console.error("Save name error:", err);
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (profile === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-pink-50">
        <Loader2 className="w-10 h-10 text-pink-400 animate-spin" />
      </main>
    );
  }

  if (!isOnboarded) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-pink-50">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShoppingBag className="text-pink-600 w-10 h-10" />
              <h1 className="text-5xl font-bold text-pink-900 tracking-tight">fitsense</h1>
            </div>
            <p className="text-pink-600 font-medium">Let's set up your style profile</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div
              className="w-28 h-28 rounded-full bg-pink-100 border-2 border-dashed border-pink-300 overflow-hidden flex-shrink-0 relative group cursor-pointer flex items-center justify-center"
              onClick={() => photoInputRef.current?.click()}
              data-testid="button-upload-photo"
            >
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
              ) : profile?.photoUrl ? (
                <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-10 h-10 text-pink-300" />
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Upload className="text-white w-6 h-6" />
              </div>
              <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} data-testid="input-photo-file" />
            </div>
            <p className="text-xs text-pink-400">Tap to add your photo</p>
          </div>

          <div className="space-y-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="What's your name?"
              className="w-full px-4 py-3 border-2 border-pink-200 rounded-2xl text-center text-lg focus:outline-none focus:border-pink-400 bg-white"
              onKeyDown={e => e.key === "Enter" && handleSaveName()}
              data-testid="input-name"
            />
            {saveError && <p className="text-red-500 text-sm text-center">{saveError}</p>}
            <button
              onClick={handleSaveName}
              disabled={!name.trim() || isSaving}
              className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-bold text-lg transition-all disabled:bg-pink-300 shadow-md shadow-pink-200 flex items-center justify-center gap-2"
              data-testid="button-save-name"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Get Started
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-pink-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-pink-600 w-6 h-6" />
            <span className="text-xl font-bold text-pink-900 tracking-tight">fitsense</span>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-pink-700 hover:text-pink-900 transition-colors" data-testid="nav-features">Features</a>
            <a href="#about" className="text-sm font-medium text-pink-700 hover:text-pink-900 transition-colors" data-testid="nav-about">About</a>
            {history && history.length > 0 && (
              <a href="#history" className="text-sm font-medium text-pink-700 hover:text-pink-900 transition-colors" data-testid="nav-history">Recent Looks</a>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full bg-pink-100 border-2 border-pink-200 overflow-hidden flex-shrink-0 relative group cursor-pointer"
              onClick={() => photoInputRef.current?.click()}
              data-testid="button-change-photo"
            >
              {isUploading ? (
                <Loader2 className="w-full h-full p-1.5 text-pink-400 animate-spin" />
              ) : profile?.photoUrl ? (
                <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-full h-full text-pink-300" />
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Upload className="text-white w-3.5 h-3.5" />
              </div>
              <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </div>
            <span className="text-sm font-semibold text-pink-900 hidden sm:block" data-testid="text-profile-name">{profile?.name || "Fashionista"}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-3">
        <p className="text-pink-700 font-medium text-sm" data-testid="text-greeting">
          Hey, {profile?.name || "Fashionista"} — ready to find your look today?
        </p>
      </div>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/landing/hero-fashion.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-24 sm:py-32 lg:py-40">
          <div className="max-w-xl space-y-6">
            <p className="text-pink-300 font-semibold tracking-wider uppercase text-sm">AI-Powered Styling</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              Your Closet, <br />Reimagined by AI
            </h1>
            <p className="text-lg text-pink-100/90 leading-relaxed max-w-md">
              Upload your wardrobe, tell us the occasion, and let AI craft the perfect outfit from clothes you already own.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl text-lg font-bold transition-all shadow-lg shadow-pink-900/30 flex items-center justify-center gap-2"
                data-testid="link-choose-fit"
              >
                <Sparkles className="w-5 h-5" />
                Choose Your Fit
              </Link>
              <Link
                href="/dashboard?view=add"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/30 rounded-2xl text-lg font-bold transition-all flex items-center justify-center gap-2"
                data-testid="link-add-closet"
              >
                Add to Closet
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <p className="text-pink-600 font-semibold text-sm uppercase tracking-wider mb-2">What You Can Do</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-pink-900">Style Made Simple</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <Link href="/dashboard?view=add" className="group block" data-testid="feature-card-closet">
            <div className="bg-white rounded-2xl border-2 border-pink-100 overflow-hidden transition-shadow hover:shadow-lg hover:shadow-pink-100">
              <div className="aspect-[16/9] overflow-hidden">
                <img src="/landing/feature-closet.jpg" alt="Your digital closet" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                    <Shirt className="w-5 h-5 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-bold text-pink-900">Add to Closet</h3>
                </div>
                <p className="text-gray-500 leading-relaxed">
                  Snap photos of your clothes and build a digital wardrobe. Our AI vision analyzes every piece for color, fabric, pattern, and style to make smarter outfit suggestions.
                </p>
              </div>
            </div>
          </Link>
          <Link href="/dashboard" className="group block" data-testid="feature-card-outfit">
            <div className="bg-white rounded-2xl border-2 border-pink-100 overflow-hidden transition-shadow hover:shadow-lg hover:shadow-pink-100">
              <div className="aspect-[16/9] overflow-hidden">
                <img src="/landing/feature-outfit.jpg" alt="AI outfit suggestions" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-bold text-pink-900">Choose Your Fit</h3>
                </div>
                <p className="text-gray-500 leading-relaxed">
                  Set your occasion, mood, and let AI check the weather. Get 3 complete outfit ideas built from your actual wardrobe, with a virtual try-on photo so you can see the look before you dress.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="bg-white border-y border-pink-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mx-auto">
                <Eye className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-bold text-pink-900">AI Vision Analysis</h3>
              <p className="text-sm text-gray-500">Every clothing photo is analyzed for color, fabric, pattern, and fit using advanced image recognition.</p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mx-auto">
                <Sun className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-bold text-pink-900">Weather Aware</h3>
              <p className="text-sm text-gray-500">Outfits are tailored to your local weather so you always dress comfortably for the day.</p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-bold text-pink-900">Made for You</h3>
              <p className="text-sm text-gray-500">Considers your occasion, mood, and body state to recommend outfits that make you feel great.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-pink-600 font-semibold text-sm uppercase tracking-wider">About FitSense</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-pink-900 leading-tight">We Believe Getting Dressed Should Feel Effortless</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                FitSense was built for every woman who has stood in front of her closet full of clothes and thought, "I have nothing to wear." We use AI to look at your actual wardrobe and create combinations you might never have thought of.
              </p>
              <p>
                Our technology scans each piece using computer vision, understands colors, textures, and styles, then pairs items intelligently based on your occasion, the weather, and how you're feeling. No shopping required, just smarter styling with what you already own.
              </p>
              <p>
                Whether it's a work meeting, a date night, or a casual weekend, FitSense has you covered. Upload your closet, tap a button, and see yourself in the outfit before you even try it on.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden aspect-[3/4]">
                <img src="/demo/elegant-maxi-dress.jpg" alt="Evening gown" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden aspect-square">
                <img src="/demo/cozy-wool-sweater.jpg" alt="Cozy sweater" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="space-y-3 pt-6">
              <div className="rounded-2xl overflow-hidden aspect-square">
                <img src="/demo/rose-gold-heels.jpg" alt="Heels" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden aspect-[3/4]">
                <img src="/demo/summer-sundress.jpg" alt="Dress" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {history && history.length > 0 && (
        <section id="history" className="max-w-4xl mx-auto px-6 pb-20">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border-2 border-pink-100">
            <h2 className="text-lg font-bold text-pink-800 flex items-center gap-2 mb-5">
              <History className="w-5 h-5" /> Recent Looks
            </h2>
            <div className="space-y-3">
              {history.map(h => {
                const isExpanded = expandedHistory === h._id;
                const outfits = h.results || [];
                return (
                  <div key={h._id} data-testid={`card-history-${h._id}`}>
                    <button
                      onClick={() => setExpandedHistory(isExpanded ? null : h._id)}
                      className="w-full text-left p-4 bg-pink-50/50 rounded-xl flex items-center justify-between gap-3 transition-colors hover:bg-pink-50"
                      data-testid={`button-expand-history-${h._id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {outfits[0]?.tryOnImageBase64 ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-pink-100">
                            <img src={`data:image/jpeg;base64,${outfits[0].tryOnImageBase64}`} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-pink-100 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-pink-300" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-pink-900 text-sm truncate">{outfits[0]?.outfitText || "Past Look"}</p>
                          <p className="text-xs text-pink-500 mt-0.5">{h.occasion} &middot; {h.weatherSummary}</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-pink-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-pink-400 flex-shrink-0" />}
                    </button>

                    {isExpanded && outfits.length > 0 && (
                      <div className="mt-2 space-y-4 px-2 pb-2">
                        {outfits.map((outfit: any, i: number) => (
                          <div key={i} className="bg-white rounded-xl border border-pink-100 overflow-hidden" data-testid={`card-history-outfit-${h._id}-${i}`}>
                            <div className="flex flex-col sm:flex-row">
                              {outfit.tryOnImageBase64 ? (
                                <div className="sm:w-48 flex-shrink-0 bg-pink-50">
                                  <img
                                    src={`data:image/jpeg;base64,${outfit.tryOnImageBase64}`}
                                    alt={outfit.outfitText}
                                    className="w-full h-full object-cover aspect-[3/4]"
                                    data-testid={`img-history-tryon-${h._id}-${i}`}
                                  />
                                </div>
                              ) : (
                                <div className="sm:w-48 flex-shrink-0 bg-pink-50 flex items-center justify-center min-h-[160px]">
                                  <ImageIcon className="w-10 h-10 text-pink-200" />
                                </div>
                              )}
                              <div className="flex-1 p-4 space-y-2">
                                <h3 className="font-bold text-pink-900" data-testid={`text-history-outfit-name-${h._id}-${i}`}>{outfit.outfitText}</h3>
                                <p className="text-sm text-gray-500 italic">{outfit.reason}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-white border-t border-pink-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-pink-600 w-5 h-5" />
            <span className="font-bold text-pink-900">fitsense</span>
          </div>
          <p className="text-sm text-gray-400">AI-powered outfit recommendations from your own closet.</p>
        </div>
      </footer>
    </main>
  );
}
