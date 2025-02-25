"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { Play, Pause, SkipBack, SkipForward, X, MoreHorizontal } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

const playerData = {
  sidhuSong: {
    name: "295",
    author: "Sidhu Moosewala",
    cover: "https://i.scdn.co/image/ab67616d0000b2731d1cc2e40d533d7bcebf5dae",
    audio: "https://drive.google.com/uc?export=download&id=1-oQHxOTy9mkfrNTLju_20kLBt3hBLHrl"
  }
}

const playlist = [
  { title: "295" },
  { title: "Same Beef" },
  { title: "Never Fold" },
]

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showPlaylist, setShowPlaylist] = useState(true)
  const [isAudioLoaded, setIsAudioLoaded] = useState(false)
  const audioRef = useRef(null)
  // Remove animation controls as we're using direct styles

  useEffect(() => {
    loadAudio()
  }, [])

  const loadAudio = () => {
    if (audioRef.current) {
      audioRef.current.src = playerData.sidhuSong.audio
      audioRef.current.load()
      audioRef.current.oncanplaythrough = () => {
        setIsAudioLoaded(true)
      }
    }
  }

  // Handle audio progress
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && isAudioLoaded) {
        audioRef.current.play().catch(error => console.error("Audio playback failed:", error))
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, isAudioLoaded])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setProgress(progress)
    }
  }

  const togglePlayPause = () => {
    if (isAudioLoaded) {
      setIsPlaying(!isPlaying)
    } else {
      loadAudio()
    }
  }

  const togglePlaylist = () => {
    setShowPlaylist(!showPlaylist)
  }

  return (
    <div className="flex flex-col items-start gap-8 w-full max-w-[680px]">
      <Card className="w-full h-[204px] overflow-hidden mx-auto">
        <CardHeader className="flex flex-row items-center justify-between py-1 px-3 bg-neutral-50">
          <div className="font-medium text-sm">Music Player</div>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex px-4 pt-4 pb-2">
          <motion.div 
            className="flex-1"
            animate={{ width: showPlaylist ? "50%" : "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 bg-neutral-50 rounded-[4px] border border-solid border-[#00000014] overflow-hidden"
              >
                <img 
                  src={playerData.sidhuSong.cover || "/placeholder.svg"} 
                  alt={playerData.sidhuSong.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5">
                <div className="font-medium text-sm text-neutral-900">
                  {playerData.sidhuSong.name}
                </div>
                <div className="font-medium text-sm text-[#666666]">
                  {playerData.sidhuSong.author}
                </div>
              </div>
            </div>

            <div className="mt-6 relative h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-teal-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-center gap-6 mt-6">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={togglePlayPause}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {showPlaylist && (
            <div className="flex-1">
              <div className="space-y-1 pl-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm text-neutral-900 pb-1">
                    Playlist
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={togglePlaylist}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {playlist.map((song, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="text-[13px] text-[#666666] leading-[18px]">
                      {song.title}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        crossOrigin="anonymous"
      />
    </div>
  )
}