"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const CLOSET_TYPES = ["top", "bottom", "dress", "shoes", "outerwear"];

const DEMO_ITEMS = [
  {
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    label: "White T-Shirt",
    type: "top",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
    label: "Blue Jeans",
    type: "bottom",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
    label: "White Sneakers",
    type: "shoes",
  },
];

export default function Dashboard() {
  const userId = "demo";
  const items = useQuery(api.closet.listClosetItems, { userId });
  const addItem = useMutation(api.closet.addClosetItem);

  const [imageUrl, setImageUrl] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState("top");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;

    setIsSubmitting(true);
    try {
      await addItem({ userId, imageUrl, label, type });
      setImageUrl("");
      setLabel("");
      setType("top");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadDemo = async () => {
    for (const item of DEMO_ITEMS) {
      await addItem({ userId, ...item });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Closet Dashboard</h1>
          <button
            onClick={loadDemo}
            className="text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Load Demo Closet
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Closet Item Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-sm border sticky top-8">
              <h2 className="text-xl font-semibold mb-4">Add Closet Item</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. My Favorite Shirt"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-semibold transition-colors"
                >
                  {isSubmitting ? "Adding..." : "Add to Closet"}
                </button>
              </form>
            </div>
          </div>

          {/* Closet Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Your Items</h2>
            {!items ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-48 bg-gray-200 animate-pulse rounded-xl"></div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-dashed text-center">
                <p className="text-gray-500">Your closet is empty. Add your first item!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div key={item._id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="aspect-square relative bg-gray-100">
                      <img
                        src={item.imageUrl}
                        alt={item.label || "Closet item"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Invalid+URL";
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">
                        {item.label || "Untitled"}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                        {item.type}
                      </span>
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
