import { NextResponse } from 'next/server';

export async function GET() {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  return NextResponse.json({
    success: true,
    googleMapsApiKey,
  });
}
