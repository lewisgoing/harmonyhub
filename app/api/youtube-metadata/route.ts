// app/api/youtube-metadata/route.ts - Just for metadata
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('id');
  
  if (!videoId) {
    return NextResponse.json({ error: 'No video ID provided' }, { status: 400 });
  }
  
  try {
    // Fetch video metadata from YouTube's oEmbed API
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch YouTube metadata');
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      title: data.title,
      author: data.author_name,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 });
  }
}