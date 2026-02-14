"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ShoppingBag, Sparkles, UserCircle, Upload, Loader2, History, Camera, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";

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
    <main className="min-h-screen bg-pink-50 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-2">
          <ShoppingBag className="text-pink-600 w-8 h-8" />
          <h1 className="text-3xl font-bold text-pink-900 tracking-tight">fitsense</h1>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-pink-100 flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-full bg-pink-100 border-2 border-pink-200 overflow-hidden flex-shrink-0 relative group cursor-pointer"
            onClick={() => photoInputRef.current?.click()}
            data-testid="button-change-photo"
          >
            {isUploading ? (
              <Loader2 className="w-full h-full p-5 text-pink-400 animate-spin" />
            ) : profile?.photoUrl ? (
              <img src={profile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-full h-full text-pink-300" />
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Upload className="text-white w-5 h-5" />
            </div>
            <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-pink-900" data-testid="text-profile-name">
              Hey, {profile?.name || "Fashionista"}
            </h2>
            <p className="text-sm text-pink-500">Click your photo to update it anytime</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard?view=add"
            className="flex-1 px-8 py-4 bg-white text-pink-600 border-2 border-pink-200 hover:bg-pink-50 rounded-2xl text-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            data-testid="link-add-closet"
          >
            Add to Closet
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 px-8 py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl text-lg font-bold transition-all shadow-md shadow-pink-200 flex items-center justify-center gap-2"
            data-testid="link-choose-fit"
          >
            <Sparkles className="w-5 h-5" />
            Choose Your Fit
          </Link>
        </div>

        {history && history.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-pink-100">
            <h2 className="text-lg font-bold text-pink-800 flex items-center gap-2 mb-4">
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
        )}
      </div>
    </main>
  );
}
