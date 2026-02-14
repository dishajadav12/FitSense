import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || "San Francisco";
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    if (!apiKey) {
      throw new Error("No API Key");
    }

    // Attempt to fetch from OpenWeatherMap
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city,
      )}&appid=${apiKey}&units=imperial`,
    );

    if (!res.ok) {
      throw new Error("Weather API request failed");
    }

    const data = await res.json();

    return NextResponse.json({
      temp: Math.round(data.main.temp),
      condition: data.weather[0].main,
      city: data.name,
    });
  } catch (err) {
    // Fallback for demo safety
    return NextResponse.json({
      temp: 60,
      condition: "Cloudy",
      city,
      isMock: true,
    });
  }
}
