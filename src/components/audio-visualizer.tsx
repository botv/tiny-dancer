'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const createFractalPattern = (depth: number, scale: number) => {
  const group = new THREE.Group();

  if (depth === 0) {
    const geometry = new THREE.BoxGeometry(scale, scale, scale);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    group.add(cube);
  } else {
    for (let i = 0; i < 4; i++) {
      const subGroup = createFractalPattern(depth - 1, scale / 3);
      subGroup.position.x = (i % 2 === 0 ? 1 : -1) * scale;
      subGroup.position.y = (i < 2 ? 1 : -1) * scale;
      group.add(subGroup);
    }
  }

  return group;
};

const AudioVisualizer = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // Add a cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const fractalGroup = createFractalPattern(3, 10);
    scene.add(fractalGroup);

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const microphone = audioContext.createMediaStreamSource(stream);
          microphone.connect(analyser);
        })
        .catch((err) => console.error('Microphone input error:', err));
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const animate = () => {
      requestAnimationFrame(animate);
      analyser.getByteFrequencyData(dataArray);

      // Use audio data to modify fractal pattern
      const lowerFrequencySum = dataArray
        .slice(0, dataArray.length / 2)
        .reduce((acc, val) => acc + val, 0);
      const scale = lowerFrequencySum / dataArray.length / 5;
      fractalGroup.rotation.x += 0.005;
      fractalGroup.rotation.y += 0.005;
      fractalGroup.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mount.removeChild(renderer.domElement);
      audioContext.close();
    };
  }, []);

  return <div ref={mountRef}></div>;
};

export default AudioVisualizer;
