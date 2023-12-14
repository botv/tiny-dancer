'use client';

import { useEffect, useState } from 'react';

const videos = [
  {
    url: '/rat.mp4',
    bpm: 117,
  },
  {
    url: '/country.mp4',
    bpm: 104.8,
  }
];

const DanceVideo = () => {
  const [tempo, setTempo] = useState<number | null>(null);
  const [lastTapTimes, setLastTapTimes] = useState<number[]>([]);
  const [video, setVideo] = useState(videos[0]);

  const handleNewVideo = () => {
    const newVideo = videos[Math.floor(Math.random() * videos.length)];
    console.log(video, newVideo);
    if (newVideo.url === video.url) {
      handleNewVideo();
    } else {
      setVideo(newVideo);
      const videoElement = document.getElementById("danceVideo") as HTMLVideoElement;
      if (videoElement) {
        videoElement.currentTime = 0;
        videoElement.src = newVideo.url;
      }
    }
  }

  console.log(video);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Enter") {
        const video = document.getElementById("danceVideo") as HTMLVideoElement;

        if (video) {
          video.currentTime = 0;
        }
      }

      if (event.code === "Space") {
        const now = Date.now();
        if (!lastTapTimes.length || now - lastTapTimes[lastTapTimes.length - 1] < 2000) {
          setLastTapTimes(prevTimes => [...prevTimes.slice(-7), now]);
        } else {
          setLastTapTimes([now]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lastTapTimes]);

  useEffect(() => {
    if (lastTapTimes.length >= 2) {
      const intervals = lastTapTimes.slice(1).map((time, index) => time - lastTapTimes[index]);
      const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setTempo(60000 / averageInterval);
    }
  }, [lastTapTimes]);

  useEffect(() => {
    const videoElement = document.getElementById("danceVideo") as HTMLVideoElement;

    if (videoElement && tempo) {
      try {
        videoElement.playbackRate = tempo / video.bpm;
      } catch {
        console.error("Failed to set playback rate");
      }
    }
  }, [tempo, video]);

  return (
    <div className="relative w-full h-full">
      <video id="danceVideo" className="w-full h-full object-cover" muted loop autoPlay>
        <source src={video.url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute top-5 left-5 bg-gray-800 border border-gray-600 shadow text-white px-3 py-1.5 rounded-md">
        {tempo ? `${tempo.toFixed(2)} BPM` : "Press space to set tempo"}
      </div>
      <button className="absolute top-5 right-5 bg-gray-800 transition hover:bg-gray-700 border border-gray-600 shadow text-white px-3 py-1.5 rounded-md appearance-none" onClick={handleNewVideo}>
        New video
      </button>
    </div>
  );
};

export default DanceVideo;
