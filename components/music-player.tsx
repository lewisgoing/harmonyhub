"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const playerData = {
  song: {
    name: "They Say It's Wonderful",
    author: "John Coltrane and Johnny Hartman",
    cover: "https://i.scdn.co/image/ab67616d0000b2731d1cc2e40d533d7bcebf5dae",
    audio: "/audio/theysayitswonderful.mp3",
  },
};

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = playerData.song.audio;
      audioRef.current.load();
      audioRef.current.oncanplaythrough = () => {
        setIsAudioLoaded(true);
      };
    }
  }, []);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  const initializeAudioContext = async () => {
    if (!audioContextRef.current && audioRef.current) {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        await context.resume();

        if (!sourceRef.current) {
          sourceRef.current = context.createMediaElementSource(audioRef.current);
        }

        const freqs = [100, 1000, 5000];
        const newFilters = freqs.map((freq) => {
          const filter = context.createBiquadFilter();
          filter.type = "peaking";
          filter.frequency.value = freq;
          filter.gain.value = 0;
          return filter;
        });

        sourceRef.current.connect(newFilters[0]);
        newFilters[0].connect(newFilters[1]);
        newFilters[1].connect(newFilters[2]);
        newFilters[2].connect(context.destination);

        audioContextRef.current = context;
        filtersRef.current = newFilters;
        
        return true;
      } catch (error) {
        return false;
      }
    }
    return audioContextRef.current !== null;
  };

  const togglePlayPause = async () => {
    if (!audioContextRef.current) {
      await initializeAudioContext();
    }
    
    if (isAudioLoaded && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        try {
          await audioRef.current.play();
        } catch (error) {
          // Silently handle errors
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const applyPreset = async (preset: "flat" | "bassBoost" | "vocalEnhancer" | "trebleBoost") => {
    if (!audioContextRef.current) {
      await initializeAudioContext();
    }
    
    if (filtersRef.current.length === 0) return;

    if (!isAudioLoaded && audioRef.current) {
      audioRef.current.load();
      await new Promise(resolve => {
        if (audioRef.current) {
          audioRef.current.oncanplaythrough = resolve;
        }
      });
      setIsAudioLoaded(true);
    }

    const presetValues: Record<"flat" | "bassBoost" | "vocalEnhancer" | "trebleBoost", number[]> = {
      flat: [0, 0, 0],
      bassBoost: [20, -3, -10], // Extremely strong bass, reduced mids and treble
      vocalEnhancer: [-10, 15, 5], // Very pronounced vocals with reduced bass
      trebleBoost: [-15, -5, 20], // Extremely bright sound, heavily reduced bass
    };

    const values = presetValues[preset];
    
    const rampTime = 0.1;
    filtersRef.current.forEach((filter, index) => {
      filter.gain.cancelScheduledValues(audioContextRef.current!.currentTime);
      filter.gain.setValueAtTime(filter.gain.value, audioContextRef.current!.currentTime);
      filter.gain.linearRampToValueAtTime(
        values[index], 
        audioContextRef.current!.currentTime + rampTime
      );
    });
    
    setActivePreset(preset);
    
    if (!isPlaying && audioRef.current && isAudioLoaded) {
      try {
        await audioRef.current.play();
        setTimeout(() => {
          if (audioRef.current && !isPlaying) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        }, 100);
      } catch (error) {
        // Silently handle errors
      }
    }
  };

  return (
    <div className="flex flex-col items-start gap-8 w-full max-w-[680px]">
      <Card className="w-full h-[280px] overflow-hidden mx-auto">
        <CardHeader className="flex flex-row items-center justify-between py-1 px-3 bg-neutral-50">
          <div className="font-medium text-sm">Music Player</div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex px-4 pt-4 pb-4">
          <motion.div 
            className="flex-1 flex flex-col"
            animate={{ width: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-4">
              <img src={playerData.song.cover} alt={playerData.song.name} className="w-12 h-12 object-cover rounded-md" />
              <div>
                <div className="font-medium text-sm text-neutral-900">{playerData.song.name}</div>
                <div className="text-sm text-[#666666]">{playerData.song.author}</div>
              </div>
            </div>

            <div className="mt-4 relative h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-center gap-6 mt-4">
              <button 
                style={{
                  backgroundColor: "#F3F4F6",
                  color: "#1F2937",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border: "none",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
                }}
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mt-8 justify-center">
              <button 
                style={{
                  backgroundColor: activePreset === "flat" ? "#374151" : "#F3F4F6",
                  color: activePreset === "flat" ? "white" : "#1F2937",
                  padding: "12px 18px",
                  borderRadius: "6px",
                  fontWeight: "500",
                  fontSize: "14px",
                  cursor: "pointer",
                  border: "none",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                }}
                onClick={() => applyPreset("flat")}
              >
                Flat
              </button>
              <button 
                style={{
                  backgroundColor: activePreset === "bassBoost" ? "#1D4ED8" : "#DBEAFE",
                  color: activePreset === "bassBoost" ? "white" : "#1E40AF",
                  padding: "12px 18px",
                  borderRadius: "6px",
                  fontWeight: "500",
                  fontSize: "14px",
                  cursor: "pointer",
                  border: "none",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                }}
                onClick={() => applyPreset("bassBoost")}
              >
                Bass Boost
              </button>
              <button 
                style={{
                  backgroundColor: activePreset === "vocalEnhancer" ? "#047857" : "#D1FAE5",
                  color: activePreset === "vocalEnhancer" ? "white" : "#065F46",
                  padding: "12px 18px",
                  borderRadius: "6px",
                  fontWeight: "500",
                  fontSize: "14px",
                  cursor: "pointer",
                  border: "none",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                }}
                onClick={() => applyPreset("vocalEnhancer")}
              >
                Vocal Enhancer
              </button>
              <button 
                style={{
                  backgroundColor: activePreset === "trebleBoost" ? "#7E22CE" : "#F3E8FF",
                  color: activePreset === "trebleBoost" ? "white" : "#6B21A8",
                  padding: "12px 18px",
                  borderRadius: "6px",
                  fontWeight: "500",
                  fontSize: "14px",
                  cursor: "pointer",
                  border: "none",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                }}
                onClick={() => applyPreset("trebleBoost")}
              >
                Treble Boost
              </button>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        crossOrigin="anonymous"
      />
    </div>
  );
}

export default MusicPlayer;

// "use client"

// import React, { useState, useRef, useEffect } from "react"
// import { motion, useAnimation } from "framer-motion"
// import { Play, Pause, SkipBack, SkipForward, X, MoreHorizontal } from 'lucide-react'
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader } from "@/components/ui/card"

// const playerData = {
//   sidhuSong: {
//     name: "295",
//     author: "Sidhu Moosewala",
//     cover: "https://i.scdn.co/image/ab67616d0000b2731d1cc2e40d533d7bcebf5dae",
//     audio: "https://drive.google.com/uc?export=download&id=1-oQHxOTy9mkfrNTLju_20kLBt3hBLHrl"
//   }
// }

// const playlist = [
//   { title: "295" },
//   { title: "Same Beef" },
//   { title: "Never Fold" },
// ]

// export function MusicPlayer() {
//   const [isPlaying, setIsPlaying] = useState(false)
//   const [progress, setProgress] = useState(0)
//   const [showPlaylist, setShowPlaylist] = useState(true)
//   const [isAudioLoaded, setIsAudioLoaded] = useState(false)
//   const audioRef = useRef(null)
//   // Remove animation controls as we're using direct styles

//   useEffect(() => {
//     loadAudio()
//   }, [])

//   const loadAudio = () => {
//     if (audioRef.current) {
//       audioRef.current.src = playerData.sidhuSong.audio
//       audioRef.current.load()
//       audioRef.current.oncanplaythrough = () => {
//         setIsAudioLoaded(true)
//       }
//     }
//   }

//   // Handle audio progress
//   useEffect(() => {
//     if (audioRef.current) {
//       if (isPlaying && isAudioLoaded) {
//         audioRef.current.play().catch(error => console.error("Audio playback failed:", error))
//       } else {
//         audioRef.current.pause()
//       }
//     }
//   }, [isPlaying, isAudioLoaded])

//   const handleTimeUpdate = () => {
//     if (audioRef.current) {
//       const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
//       setProgress(progress)
//     }
//   }

//   const togglePlayPause = () => {
//     if (isAudioLoaded) {
//       setIsPlaying(!isPlaying)
//     } else {
//       loadAudio()
//     }
//   }

//   const togglePlaylist = () => {
//     setShowPlaylist(!showPlaylist)
//   }

//   return (
//     <div className="flex flex-col items-start gap-8 w-full max-w-[680px]">
//       <Card className="w-full h-[204px] overflow-hidden mx-auto">
//         <CardHeader className="flex flex-row items-center justify-between py-1 px-3 bg-neutral-50">
//           <div className="font-medium text-sm">Music Player</div>
//           <Button variant="ghost" size="icon" className="h-6 w-6">
//             <X className="h-4 w-4" />
//           </Button>
//         </CardHeader>

//         <CardContent className="flex px-4 pt-4 pb-2">
//           <motion.div 
//             className="flex-1"
//             animate={{ width: showPlaylist ? "50%" : "100%" }}
//             transition={{ duration: 0.3, ease: "easeInOut" }}
//           >
//             <div className="flex items-center gap-4">
//               <div 
//                 className="w-12 h-12 bg-neutral-50 rounded-[4px] border border-solid border-[#00000014] overflow-hidden"
//               >
//                 <img 
//                   src={playerData.sidhuSong.cover || "/placeholder.svg"} 
//                   alt={playerData.sidhuSong.name}
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//               <div className="space-y-0.5">
//                 <div className="font-medium text-sm text-neutral-900">
//                   {playerData.sidhuSong.name}
//                 </div>
//                 <div className="font-medium text-sm text-[#666666]">
//                   {playerData.sidhuSong.author}
//                 </div>
//               </div>
//             </div>

//             <div className="mt-6 relative h-1.5 bg-neutral-200 rounded-full overflow-hidden">
//               <div 
//                 className="absolute top-0 left-0 h-full bg-teal-500 rounded-full"
//                 style={{ width: `${progress}%` }}
//               />
//             </div>

//             <div className="flex justify-center gap-6 mt-6">
//               <Button variant="ghost" size="icon" className="h-8 w-8">
//                 <SkipBack className="h-4 w-4" />
//               </Button>
//               <Button 
//                 variant="ghost" 
//                 size="icon" 
//                 className="h-8 w-8"
//                 onClick={togglePlayPause}
//               >
//                 {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
//               </Button>
//               <Button variant="ghost" size="icon" className="h-8 w-8">
//                 <SkipForward className="h-4 w-4" />
//               </Button>
//             </div>
//           </motion.div>

//           {showPlaylist && (
//             <div className="flex-1">
//               <div className="space-y-1 pl-4">
//                 <div className="flex items-center justify-between">
//                   <div className="font-medium text-sm text-neutral-900 pb-1">
//                     Playlist
//                   </div>
//                   <Button 
//                     variant="ghost" 
//                     size="icon" 
//                     className="h-6 w-6"
//                     onClick={togglePlaylist}
//                   >
//                     <X className="h-4 w-4" />
//                   </Button>
//                 </div>
//                 {playlist.map((song, index) => (
//                   <div key={index} className="flex items-center justify-between">
//                     <div className="text-[13px] text-[#666666] leading-[18px]">
//                       {song.title}
//                     </div>
//                     <Button variant="ghost" size="icon" className="h-6 w-6">
//                       <MoreHorizontal className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       <audio 
//         ref={audioRef}
//         onTimeUpdate={handleTimeUpdate}
//         onEnded={() => setIsPlaying(false)}
//         crossOrigin="anonymous"
//       />
//     </div>
//   )
// }