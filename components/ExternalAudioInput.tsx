"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Music, Youtube, Link as LinkIcon, Loader2, AlertCircle, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

interface ExternalAudioInputProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAudioSelected: (audio: {
    name: string;
    author: string;
    cover: string;
    audio: string;
    sourceType: 'youtube' | 'soundcloud' | 'direct';
    sourceUrl: string;
  }) => void;
}

type AudioSource = 'youtube' | 'soundcloud' | 'direct' | null;

// Simple function to determine URL type
const getUrlType = (url: string): AudioSource => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      return 'youtube';
    } else if (urlObj.hostname.includes('soundcloud.com')) {
      return 'soundcloud';
    } else if (url.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      return 'direct';
    }
  } catch (e) {
    // Not a valid URL
    return null;
  }
  
  return null;
};

// Extract YouTube video ID from URL
const getYoutubeVideoId = (url: string): string | null => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

// Extract title from URL if possible
const getTitleFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Try to extract a title from the path
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
    if (pathSegments.length > 0) {
      // Replace hyphens with spaces and capitalize words
      const lastSegment = pathSegments[pathSegments.length - 1];
      return lastSegment
        .replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '')
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return 'Audio Track';
};

// Safe function to get content from direct URLs
const getMediaFromUrl = (url: string): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    
    audio.oncanplay = () => resolve(audio);
    audio.onerror = (e) => reject(new Error("Couldn't load audio. The URL might be restricted or not support CORS."));
    
    // Set source and start loading
    audio.src = url;
    audio.load();
  });
};

// Demo YouTube video IDs with titles for quick testing
const demoYoutubeVideos = [
  { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up' },
  { id: 'L_jWHffIx5E', title: 'Smash Mouth - All Star' },
  { id: '3O1_3zBUKM8', title: 'Weightless - Ambient Music for Stress Relief' }
];

// Demo SoundCloud tracks with titles for quick testing
const demoSoundCloudTracks = [
  { url: 'https://soundcloud.com/lo-fi-hip-hop-study-beats/lo-fi-hip-hop-study-beats', title: 'Lo-Fi Hip Hop Study Beats' },
  { url: 'https://soundcloud.com/relaxdaily/relaxing-music-calm-studying', title: 'Relaxing Music - Calm Studying' }
];

export function ExternalAudioInput({ 
  open, 
  onOpenChange, 
  onAudioSelected 
}: ExternalAudioInputProps) {
  const [url, setUrl] = useState('');
  const [urlType, setUrlType] = useState<AudioSource>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // Update URL type when URL changes
  useEffect(() => {
    setUrlType(getUrlType(url));
    setError(null);
  }, [url]);

  // Reset state when dialog opens and focus on input
  useEffect(() => {
    if (open) {
      setUrl('');
      setUrlType(null);
      setIsProcessing(false);
      setError(null);
      
      // Focus the input after a short delay to allow the dialog to render
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Process based on URL type
      if (urlType === 'youtube') {
        // Fix: YouTube doesn't work in this direct way due to CORS issues
        // We need to use a server-side approach or a proxy
        
        const videoId = getYoutubeVideoId(url);
        if (!videoId) {
          throw new Error('Invalid YouTube URL');
        }

        const demoYoutubeVideos = [
            { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up' },
            { id: 'L_jWHffIx5E', title: 'Smash Mouth - All Star' },
            { id: '3O1_3zBUKM8', title: 'Weightless - Ambient Music for Stress Relief' }
          ];

          const demoMatch = demoYoutubeVideos.find(v => v.id === videoId);
          const title = demoMatch?.title || 'YouTube Video';
          
        // Use a placeholder audio instead of trying to embed YouTube directly
        const audioData = {
          name: demoMatch?.title || 'YouTube Video',
          author: "YouTube Creator",
          cover: `https://img.youtube.com/vi/${videoId}/0.jpg`,
          // Use a placeholder audio instead
          audio: "https://storage.googleapis.com/media-session/elephants-dream/the-wires.mp3",
          sourceType: 'youtube' as const,
          sourceUrl: url
        };
        
        onAudioSelected(audioData);
        onOpenChange(false);
      }
      else if (urlType === 'soundcloud') {
        // Find a matching demo track or use generic metadata
        const demoMatch = demoSoundCloudTracks.find(t => url.includes(t.url));
        const title = demoMatch?.title || getTitleFromUrl(url) || 'SoundCloud Track';
        
        // For the demo, we'll just use our sample audio
        // In a real app, you'd extract audio server-side
        const audioData = {
          name: title,
          author: "SoundCloud Artist",
          cover: "https://static.soundcloud.com/media/soundcloud-square-logo.png", // SoundCloud logo
          audio: "https://storage.googleapis.com/media-session/elephants-dream/the-wires.mp3", // Using sample audio as placeholder
          sourceType: 'soundcloud' as const,
          sourceUrl: url
        };

        onAudioSelected(audioData);
        onOpenChange(false);
        
        toast({
          title: "SoundCloud track added",
          description: `Now playing: ${title}`,
        });
      }
      else if (urlType === 'direct') {
        // For direct audio URLs, try to load the audio to test CORS
        try {
          const audio = await getMediaFromUrl(url);
          
          const title = getTitleFromUrl(url);
          
          const audioData = {
            name: title,
            author: "Unknown Artist",
            cover: "/placeholder.svg",
            audio: url,
            sourceType: 'direct' as const,
            sourceUrl: url
          };

          onAudioSelected(audioData);
          onOpenChange(false);
          
          toast({
            title: "Audio file added",
            description: `Now playing: ${title}`,
          });
        } catch (err) {
          throw new Error("This audio URL may be restricted. Try a different source.");
        }
      }
      else {
        throw new Error('Unsupported URL type');
      }
    } catch (err) {
      console.error('Error processing audio URL:', err);
      setError(err instanceof Error ? err.message : 'Failed to process URL');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get icon based on URL type
  const getUrlIcon = () => {
    switch(urlType) {
      case 'youtube':
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <Youtube className="h-5 w-5 text-red-500" />
          </motion.div>
        );
      case 'soundcloud':
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <Waves className="h-5 w-5 text-orange-500" />
          </motion.div>
        );
      case 'direct':
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <Music className="h-5 w-5 text-blue-500" />
          </motion.div>
        );
      default:
        return (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ rotate: url ? [0, -10, 10, -10, 10, 0] : 0 }}
            transition={{ duration: 0.5 }}
          >
            <LinkIcon className="h-5 w-5 text-gray-400" />
          </motion.div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add External Audio</DialogTitle>
          <DialogDescription>
            Paste a link to play audio from YouTube, SoundCloud, or direct audio URLs.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Single unified input field */}
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                {getUrlIcon()}
              </div>
              <Input
                ref={inputRef}
                placeholder="Paste audio URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Supported platforms */}
            <motion.div 
              className="flex flex-wrap gap-2 text-xs text-muted-foreground justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100">
                <Youtube className="h-3 w-3 text-red-500" />
                <span>YouTube</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100">
              <Waves className="h-5 w-5 text-orange-500" />
                <span>SoundCloud</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100">
                <Music className="h-3 w-3 text-blue-500" />
                <span>MP3/WAV/OGG</span>
              </div>
            </motion.div>
          </div>
          
          {/* Demo suggestions */}
          {!url && (
            <motion.div 
              className="border rounded-lg p-3 space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-sm font-medium">Try these examples:</p>
              <div className="space-y-1.5">
                <motion.button
                  className="flex items-center gap-2 text-sm w-full text-left p-1.5 rounded hover:bg-gray-100"
                  whileHover={{ x: 2 }}
                  onClick={() => setUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
                >
                  <Youtube className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                  <span className="truncate">Rick Astley - Never Gonna Give You Up</span>
                </motion.button>
                <motion.button
                  className="flex items-center gap-2 text-sm w-full text-left p-1.5 rounded hover:bg-gray-100"
                  whileHover={{ x: 2 }}
                  onClick={() => setUrl('https://soundcloud.com/lo-fi-hip-hop-study-beats/lo-fi-hip-hop-study-beats')}
                >
                  <Waves className="h-5 w-5 text-orange-500" />
                  <span className="truncate">Lo-Fi Hip Hop Study Beats</span>
                </motion.button>
              </div>
            </motion.div>
          )}
          
          {/* URL detection feedback */}
          <AnimatePresence mode="wait">
            {urlType && (
              <motion.div
                key="urlType"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md flex items-center gap-2">
                  {urlType === 'youtube' && <Youtube className="h-4 w-4 text-red-500" />}
                  {urlType === 'soundcloud' && <Waves className="h-5 w-5 text-orange-500" />}
                  {urlType === 'direct' && <Music className="h-4 w-4 text-blue-500" />}
                  
                  <p>
                    {urlType === 'youtube' && 'YouTube video detected'}
                    {urlType === 'soundcloud' && 'SoundCloud track detected'}
                    {urlType === 'direct' && 'Direct audio file detected'}
                  </p>
                </div>
              </motion.div>
            )}
            
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 py-2 text-sm bg-red-50 text-red-500 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button" 
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <motion.div
            whileHover={{ scale: urlType ? 1.02 : 1 }}
            whileTap={{ scale: urlType ? 0.98 : 1 }}
          >
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing || !urlType}
              className={`relative ${!urlType ? 'opacity-50' : ''}`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Play Audio'
              )}
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExternalAudioInput;