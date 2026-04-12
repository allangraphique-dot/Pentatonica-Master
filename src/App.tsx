/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, ChevronLeft, ChevronRight, Info, Play, Pause, Volume2, VolumeX } from 'lucide-react';

// --- Constants & Types ---

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STRINGS = [
  { note: 'E', octave: 4 }, // 1st string (high E)
  { note: 'B', octave: 3 },
  { note: 'G', octave: 3 },
  { note: 'D', octave: 3 },
  { note: 'A', octave: 2 },
  { note: 'E', octave: 2 }, // 6th string (low E)
];

const PENTATONIC_INTERVALS = {
  minor: [0, 3, 5, 7, 10], // Root, b3, 4, 5, b7
  major: [0, 2, 4, 7, 9],  // Root, 2, 3, 5, 6
};

const INTERVAL_NAMES = {
  minor: ['T', 'b3', '4', '5', 'b7'],
  major: ['T', '2', '3', '5', '6'],
};

const SHAPES = [
  { id: 1, name: 'Forma 1', description: 'Inicia na Tônica' },
  { id: 2, name: 'Forma 2', description: 'Inicia na Terça Menor' },
  { id: 3, name: 'Forma 3', description: 'Inicia na Quarta Justa' },
  { id: 4, name: 'Forma 4', description: 'Inicia na Quinta Justa' },
  { id: 5, name: 'Forma 5', description: 'Inicia na Sétima Menor' },
];

// --- Helpers ---

const getNoteAtFret = (stringRootNote: string, fret: number) => {
  const rootIndex = NOTES.indexOf(stringRootNote);
  return NOTES[(rootIndex + fret) % 12];
};

const getInterval = (rootNote: string, currentNote: string, scaleType: 'minor' | 'major') => {
  const rootIdx = NOTES.indexOf(rootNote);
  const currentIdx = NOTES.indexOf(currentNote);
  const semitones = (currentIdx - rootIdx + 12) % 12;
  const intervalIdx = PENTATONIC_INTERVALS[scaleType].indexOf(semitones);
  return intervalIdx !== -1 ? INTERVAL_NAMES[scaleType][intervalIdx] : null;
};

// --- Metronome Component ---

function Metronome() {
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  
  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number | null>(null);
  
  const scheduleNote = (beatNumber: number, time: number) => {
    if (!audioContext.current) return;
    
    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    osc.frequency.value = beatNumber % 4 === 0 ? 1000 : 800;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  };

  const scheduler = () => {
    while (nextNoteTime.current < audioContext.current!.currentTime + 0.1) {
      scheduleNote(beat, nextNoteTime.current);
      nextNoteTime.current += 60.0 / bpm;
      setBeat((prev) => (prev + 1) % 4);
    }
    timerID.current = window.setTimeout(scheduler, 25);
  };

  const toggleMetronome = () => {
    if (isPlaying) {
      if (timerID.current) clearTimeout(timerID.current);
      setIsPlaying(false);
      setBeat(0);
    } else {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      nextNoteTime.current = audioContext.current.currentTime;
      setIsPlaying(true);
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerID.current) clearTimeout(timerID.current);
    };
  }, []);

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex items-center gap-6 shadow-lg">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-mono text-[#555] uppercase tracking-widest">Metrônomo</span>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMetronome}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isPlaying 
                ? 'bg-[#ff4444] text-white shadow-[0_0_15px_rgba(255,68,68,0.4)]' 
                : 'bg-[#333] text-[#888] hover:bg-[#444] hover:text-white'
            }`}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
          
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-white leading-none">{bpm}</span>
              <span className="text-[10px] font-mono text-[#555]">BPM</span>
            </div>
            <div className="flex gap-1 mt-1">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-100 ${
                    isPlaying && (beat - 1 + 4) % 4 === i 
                      ? (i === 0 ? 'bg-[#ff4444] scale-125 shadow-[0_0_5px_#ff4444]' : 'bg-white scale-125 shadow-[0_0_5px_#fff]') 
                      : 'bg-[#333]'
                  }`} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 min-w-[120px]">
        <input
          type="range"
          min="40"
          max="240"
          value={bpm}
          onChange={(e) => setBpm(parseInt(e.target.value))}
          className="w-full accent-[#ff4444] h-1 bg-[#333] rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-[9px] font-mono text-[#444]">
          <span>40</span>
          <span>140</span>
          <span>240</span>
        </div>
      </div>
    </div>
  );
}

// --- Components ---

export default function App() {
  const [selectedKey, setSelectedKey] = useState('A');
  const [scaleType, setScaleType] = useState<'minor' | 'major'>('minor');
  const [selectedShape, setSelectedShape] = useState(1);
  const [showNotes, setShowNotes] = useState(false); // Toggle between interval name and note name

  // Calculate which frets to show based on the shape and key
  const baseFret = useMemo(() => {
    const rootPos = NOTES.indexOf(selectedKey);
    // Offset for each shape relative to the root on the 6th string
    // Minor: 0, 3, 5, 7, 10
    // Major: 0, 2, 4, 7, 9
    const shapeOffsets = PENTATONIC_INTERVALS[scaleType];
    let startFret = (rootPos - NOTES.indexOf('E') + 12) % 12;
    startFret += shapeOffsets[selectedShape - 1];
    return startFret % 12;
  }, [selectedKey, selectedShape, scaleType]);

  const fretRange = useMemo(() => {
    // Show 5 frets starting from baseFret
    return Array.from({ length: 5 }, (_, i) => (baseFret + i));
  }, [baseFret]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans selection:bg-[#ff4444]/30">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] bg-[#111] p-6 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#ff4444] flex items-center justify-center shadow-[0_0_15px_rgba(255,68,68,0.4)]">
              <Music className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Pentatônica Master</h1>
              <p className="text-xs text-[#888] font-mono uppercase tracking-widest">by Allan Krainski</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-[#2a2a2a]">
              <button
                onClick={() => setScaleType('minor')}
                className={`px-4 py-1.5 rounded-md text-xs font-mono uppercase tracking-widest transition-all ${
                  scaleType === 'minor' ? 'bg-[#ff4444] text-white shadow-lg' : 'text-[#555] hover:text-[#888]'
                }`}
              >
                Menor
              </button>
              <button
                onClick={() => setScaleType('major')}
                className={`px-4 py-1.5 rounded-md text-xs font-mono uppercase tracking-widest transition-all ${
                  scaleType === 'major' ? 'bg-[#ff4444] text-white shadow-lg' : 'text-[#555] hover:text-[#888]'
                }`}
              >
                Maior
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-end">
              {NOTES.map((note) => (
                <button
                  key={note}
                  onClick={() => setSelectedKey(note)}
                  className={`px-3 py-1.5 rounded-md text-sm font-mono transition-all duration-200 border ${
                    selectedKey === note
                      ? 'bg-[#ff4444] border-[#ff4444] text-white shadow-[0_0_10px_rgba(255,68,68,0.3)]'
                      : 'bg-[#1a1a1a] border-[#2a2a2a] text-[#888] hover:border-[#444] hover:text-white'
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-12">
        {/* Metronome & Quick Controls */}
        <section className="grid md:grid-cols-2 gap-6 items-end">
          <Metronome />
          <div className="hidden md:flex flex-col gap-2 text-right">
            <p className="text-[10px] font-mono text-[#444] uppercase tracking-[0.2em]">
              Sincronize seu treino
            </p>
            <p className="text-xs text-[#666]">
              Ajuste o BPM para praticar a precisão rítmica em cada desenho da escala.
            </p>
          </div>
        </section>

        {/* Shape Selector */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono uppercase tracking-widest text-[#888]">Selecione o Desenho</h2>
            <div className="flex items-center gap-2 text-xs text-[#555]">
              <Info size={14} />
              <span>
                {scaleType === 'minor' 
                  ? '5 formas derivadas da escala menor natural' 
                  : 'A escala pentatônica maior é derivada da escala maior diatônica (natural), formada pela remoção do 4º e do 7º graus'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {SHAPES.map((shape) => (
              <button
                key={shape.id}
                onClick={() => setSelectedShape(shape.id)}
                className={`p-4 rounded-xl border transition-all text-left group ${
                  selectedShape === shape.id
                    ? 'bg-[#1a1a1a] border-[#ff4444] shadow-[inset_0_0_20px_rgba(255,68,68,0.05)]'
                    : 'bg-[#111] border-[#222] hover:border-[#333]'
                }`}
              >
                <span className={`block text-xs font-mono mb-1 ${selectedShape === shape.id ? 'text-[#ff4444]' : 'text-[#555]'}`}>
                  0{shape.id}
                </span>
                <span className={`block font-bold ${selectedShape === shape.id ? 'text-white' : 'text-[#888]'}`}>
                  {shape.name}
                </span>
                <span className="block text-[10px] text-[#555] mt-1 group-hover:text-[#777] transition-colors">
                  {shape.description}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Fretboard Section */}
        <section className="relative bg-[#111] rounded-2xl border border-[#1a1a1a] p-8 shadow-inner overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {selectedKey} <span className="text-[#ff4444]">{scaleType === 'minor' ? 'Menor' : 'Maior'}</span>
                </span>
                <div className="h-4 w-px bg-[#222]" />
                <span className="text-sm text-[#888] font-mono uppercase tracking-widest">
                  {SHAPES.find(s => s.id === selectedShape)?.name}
                </span>
              </div>
              
              <button 
                onClick={() => setShowNotes(!showNotes)}
                className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border border-[#222] text-[#555] hover:text-white hover:border-[#444] transition-all"
              >
                {showNotes ? 'Ver Intervalos' : 'Ver Notas'}
              </button>
            </div>

            {/* Fretboard Visualizer */}
            <div className="relative overflow-x-auto pb-4 scrollbar-hide">
              <div className="min-w-[600px] relative">
                {/* Fret Numbers */}
                <div className="flex mb-2">
                  <div className="w-12" /> {/* Nut space */}
                  {fretRange.map((fret) => (
                    <div key={fret} className="flex-1 text-center text-[10px] font-mono text-[#444]">
                      {fret === 0 ? 'NUT' : fret}
                    </div>
                  ))}
                </div>

                {/* Strings */}
                <div className="relative border-l-4 border-[#333]">
                  {STRINGS.map((string, sIdx) => (
                    <div key={sIdx} className="relative h-12 flex items-center group">
                      {/* String Line */}
                      <div 
                        className="absolute w-full bg-gradient-to-r from-[#333] via-[#444] to-[#333] shadow-sm" 
                        style={{ height: `${1 + (5 - sIdx) * 0.5}px` }} 
                      />
                      
                      {/* String Label */}
                      <div className="w-12 text-xs font-mono text-[#666] flex items-center justify-center bg-[#111] z-10">
                        {string.note}
                      </div>

                      {/* Frets */}
                      <div className="flex-1 flex relative">
                        {fretRange.map((fret, fIdx) => {
                          const note = getNoteAtFret(string.note, fret);
                          const interval = getInterval(selectedKey, note, scaleType);
                          const isRoot = interval === 'T';

                          return (
                            <div key={fIdx} className="flex-1 h-12 relative flex items-center justify-center border-r border-[#222]">
                              <AnimatePresence mode="wait">
                                {interval && (
                                  <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold z-20 shadow-lg cursor-default transition-transform hover:scale-110 ${
                                      isRoot 
                                        ? 'bg-[#ff4444] text-white shadow-[0_0_15px_rgba(255,68,68,0.5)]' 
                                        : 'bg-[#2a2a2a] text-[#ccc] border border-[#333]'
                                    }`}
                                  >
                                    {showNotes ? note : interval}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Legend & Info */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] p-6 space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-[#888]">Legenda de Intervalos</h3>
            <div className="grid grid-cols-1 gap-3">
              {scaleType === 'minor' ? (
                [
                  { label: 'T', name: 'Tônica', desc: 'A nota fundamental da escala.' },
                  { label: 'b3', name: 'Terça Menor', desc: 'Define o caráter menor (3 semitons).' },
                  { label: '4', name: 'Quarta Justa', desc: 'Intervalo de repouso (5 semitons).' },
                  { label: '5', name: 'Quinta Justa', desc: 'Estabilidade (7 semitons).' },
                  { label: 'b7', name: 'Sétima Menor', desc: 'Tensão característica (10 semitons).' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      item.label === 'T' ? 'bg-[#ff4444] text-white' : 'bg-[#2a2a2a] text-[#ccc]'
                    }`}>
                      {item.label}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-[#555]">{item.desc}</p>
                    </div>
                  </div>
                ))
              ) : (
                [
                  { label: 'T', name: 'Tônica', desc: 'A nota fundamental da escala.' },
                  { label: '2', name: 'Segunda Maior', desc: 'Intervalo de passagem (2 semitons).' },
                  { label: '3', name: 'Terça Maior', desc: 'Define o caráter maior (4 semitons).' },
                  { label: '5', name: 'Quinta Justa', desc: 'Estabilidade (7 semitons).' },
                  { label: '6', name: 'Sexta Maior', desc: 'Brilho característico (9 semitons).' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4 p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      item.label === 'T' ? 'bg-[#ff4444] text-white' : 'bg-[#2a2a2a] text-[#ccc]'
                    }`}>
                      {item.label}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-[#555]">{item.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-[#111] rounded-2xl border border-[#1a1a1a] p-6 space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-[#888]">Dicas de Estudo</h3>
            <ul className="space-y-3 text-xs text-[#888]">
              <li className="flex gap-3">
                <span className="text-[#ff4444] font-mono">01.</span>
                <span>Pratique cada desenho lentamente, focando na clareza de cada nota.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#ff4444] font-mono">02.</span>
                <span>Tente conectar os desenhos deslizando entre eles (slides).</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#ff4444] font-mono">03.</span>
                <span>Cante as notas ou intervalos enquanto toca para treinar o ouvido.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[#ff4444] font-mono">04.</span>
                <span>Use um metrônomo para garantir que seu tempo esteja firme.</span>
              </li>
            </ul>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto p-12 text-center border-t border-[#1a1a1a] mt-12">
        <p className="text-[10px] font-mono text-[#444] uppercase tracking-[0.2em]">
          Desenvolvido por Allan Krainski
        </p>
      </footer>
    </div>
  );
}
