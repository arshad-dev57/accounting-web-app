import { NextResponse } from 'next/server';

/**
 * Server-only Maps key (`GOOGLE_MAPS_API_KEY`).
 * Avoids NEXT_PUBLIC_ so it can be set as a private env on Vercel.
 */
export async function GET() {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  return NextResponse.json({
    success: true,
    googleMapsApiKey,
  });
}
