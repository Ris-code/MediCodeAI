
import React, { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import dotenv from 'dotenv';
dotenv.config();

const URL = "https://datavisproject.s3.us-east-1.amazonaws.com/voice.mp3"

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlayPause = () => {
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <audio
        ref= {audioRef}
        src= {URL}
        className="hidden"
      />
      <button
        onClick={togglePlayPause}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-colors duration-200"
      >
        {isPlaying ? (
          <Pause className="w-6 h-6" />
        ) : (
          <Play className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};

export default AudioPlayer;
