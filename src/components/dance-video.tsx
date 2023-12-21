'use client';

import { useEffect, useRef, useState } from 'react';
import Metronome from '@/helpers/metronome';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinus } from '@fortawesome/pro-solid-svg-icons/faMinus';
import { faPlus } from '@fortawesome/pro-solid-svg-icons/faPlus';
import { faPlay } from '@fortawesome/pro-solid-svg-icons/faPlay';
import { faPause } from '@fortawesome/pro-solid-svg-icons/faPause';
import { faBackwardFast } from '@fortawesome/pro-solid-svg-icons/faBackwardFast';
import { faForwardFast } from '@fortawesome/pro-solid-svg-icons/faForwardFast';
import {
  defaultTempo,
  maxSpacebarTapInterval,
  maxSpacebarTaps,
  showTempoIndicator,
  videos,
} from '@/lib/config';
import { faCircle } from '@fortawesome/pro-regular-svg-icons/faCircle';
import { faCircle as faCircleSolid } from '@fortawesome/pro-solid-svg-icons/faCircle';

const metronome = new Metronome(defaultTempo);

const DanceVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [tempo, setTempo] = useState<number>(metronome.tempo);
  const [lastTapTimes, setLastTapTimes] = useState<number[]>([]);
  const [tickTock, setTickTock] = useState(false);
  const [video, setVideo] = useState(videos[0]);
  const [paused, setPaused] = useState(true);

  const handleNextVideo = () => {
    const nextVideo = videos[(videos.indexOf(video) + 1) % videos.length];
    setVideo(nextVideo);

    if (!videoRef.current) return;
    videoRef.current.src = nextVideo.url;
    videoRef.current.currentTime = 0;
    void videoRef.current.play();
  };

  const handlePause = () => {
    if (!videoRef.current) return;

    setPaused(true);
    void videoRef.current.pause();
  };

  const handlePlay = () => {
    if (!videoRef.current) return;

    setPaused(false);
    void videoRef.current.play();
    if (!metronome.isRunning) metronome.start();
  };

  const handleRestart = () => {
    if (!videoRef.current) return;

    setPaused(false);

    videoRef.current.currentTime = 0;
    void videoRef.current.play();
    metronome.start();
  };

  // Rerender on every tick.
  useEffect(() => {
    metronome.schedule(() => {
      setTickTock((prev) => !prev);
    }, true);
  }, []);

  // Handle keyboard events.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Restart the video and metronome when the enter key is pressed.
      if (event.code === 'Enter') {
        handleRestart();
        event.preventDefault();
      }

      // Set the tempo when the space bar is pressed.
      if (event.code === 'Space') {
        handlePlay();
        const now = Date.now();
        setLastTapTimes((prevTimes) => {
          // If there are no previous tap times, or if the last tap was more than 2 seconds ago,
          // then start a new list of tap times.
          if (prevTimes.length === 0) {
            return [now];
          } else if (
            now - prevTimes[prevTimes.length - 1] >
            maxSpacebarTapInterval
          ) {
            return [now];
          } else {
            return [...prevTimes.slice(-(maxSpacebarTaps - 1)), now];
          }
        });

        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Update the tempo when the last tap time changes.
  useEffect(() => {
    if (lastTapTimes.length >= 2) {
      const intervals = lastTapTimes
        .slice(1)
        .map((time, index) => time - lastTapTimes[index]);
      const averageInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      setTempo(60000 / averageInterval);
    }
  }, [lastTapTimes]);

  // Update the video playback rate when the tempo changes.
  useEffect(() => {
    metronome.setTempo(tempo);
    metronome.schedule(() => {
      if (!videoRef.current) return;
      videoRef.current.playbackRate = tempo / video.bpm;
    });
  }, [tempo, video]);

  // Preload the next video so it starts playing immediately.
  useEffect(() => {
    const nextVideo = videos[(videos.indexOf(video) + 1) % videos.length];
    const nextVideoElement = document.createElement('video');
    nextVideoElement.src = nextVideo.url;
    nextVideoElement.preload = 'auto';
  }, [video]);

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        onEnded={() => {
          metronome.schedule(() => {
            if (!videoRef.current) return;
            videoRef.current.currentTime = 0;
            void videoRef.current.play();
          });
        }}
      >
        <source src={video.url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute top-5 left-5 flex space-x-2">
        <div className="bg-gray-800 border border-gray-600 shadow text-white px-3 py-1.5 rounded-md select-none">
          {lastTapTimes.length ? (
            <div>
              {showTempoIndicator && (
                <FontAwesomeIcon
                  icon={tickTock ? faCircle : faCircleSolid}
                  className="mr-2"
                />
              )}
              {tempo.toFixed(1)} BPM
            </div>
          ) : (
            'Tap the space bar to set the tempo'
          )}
        </div>
        <div className="bg-gray-800 border border-gray-600 shadow text-white rounded-md overflow-hidden">
          <div className="flex items-center divide-x divide-gray-600">
            <button
              className="transition hover:bg-gray-700 px-3 py-1.5 appearance-none focus:outline-none"
              onClick={() => setTempo((prev) => prev && Math.round(prev - 1))}
            >
              <FontAwesomeIcon icon={faMinus} fixedWidth />
            </button>
            <button
              className="transition hover:bg-gray-700 px-3 py-1.5 appearance-none focus:outline-none"
              onClick={() => setTempo((prev) => prev && Math.round(prev + 1))}
            >
              <FontAwesomeIcon icon={faPlus} fixedWidth />
            </button>
            <button
              className="transition hover:bg-gray-700 px-3 py-1.5 appearance-none focus:outline-none"
              onClick={paused ? handlePlay : handlePause}
            >
              <FontAwesomeIcon icon={paused ? faPlay : faPause} fixedWidth />
            </button>
            <button
              className="transition hover:bg-gray-700 px-3 py-1.5 appearance-none focus:outline-none"
              onClick={handleRestart}
            >
              <FontAwesomeIcon icon={faBackwardFast} fixedWidth />
            </button>
            <button
              className="transition hover:bg-gray-700 px-3 py-1.5 appearance-none focus:outline-none"
              onClick={handleNextVideo}
            >
              <FontAwesomeIcon icon={faForwardFast} fixedWidth />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DanceVideo;
