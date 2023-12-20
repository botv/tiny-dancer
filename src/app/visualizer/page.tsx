import AudioVisualizer from '@/components/audio-visualizer';

export default function Visualizer() {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-10">
      <AudioVisualizer />
    </div>
  );
}
