import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || "San Francisco";
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    if (!apiKey) {
      throw new Error("No API Key");
    }

    // Attempt to fetch from a real weather API (e.g., OpenWeatherMap or similar)
    // For this minimal step, we'll simulate the call structure
    // const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`);
    // const data = await res.json();
    
    // Simulating a response for the demo
    return NextResponse.json({
      temp: 55,
      condition: "Rainy",
      city
    });
  } catch (err) {
    // Fallback for demo safety
    return NextResponse.json({
      temp: 60,
      condition: "Cloudy",
      city,
      isMock: true
    });
  }
}
