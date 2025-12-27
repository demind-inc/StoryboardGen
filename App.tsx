
import React, { useState, useEffect, useRef } from 'react';
import { ImageSize, SceneResult, ReferenceImage, SlideContent } from './types';
import { generateCharacterScene, generateSlideshowStructure } from './services/geminiService';
import ApiKeyGuard from './components/ApiKeyGuard';

type AppMode = 'slideshow' | 'manual';

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [mode, setMode] = useState<AppMode>('slideshow');
  const [topic, setTopic] = useState<string>("");
  const [manualPrompts, setManualPrompts] = useState<string>("Boy looking confused with question marks around him\nBoy feeling lonely at a cafe table\nBoy looking angry while listening to something");
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [slideshowResults, setSlideshowResults] = useState<SceneResult[]>([]);
  const [manualResults, setManualResults] = useState<SceneResult[]>([]);
  const [size, setSize] = useState<ImageSize>('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingStoryboard, setIsCreatingStoryboard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferences(prev => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            data: reader.result as string,
            mimeType: file.type
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReference = (id: string) => {
    setReferences(prev => prev.filter(r => r.id !== id));
  };

  const handleGenerateStoryboard = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic first.");
      return;
    }
    setIsCreatingStoryboard(true);
    try {
      const slides = await generateSlideshowStructure(topic);
      if (slides.length > 0) {
        const newResults: SceneResult[] = slides.map((slide, idx) => ({
          title: slide.title,
          description: slide.description,
          prompt: slide.prompt,
          isLoading: false,
          isCTA: idx === slides.length - 1
        }));
        setSlideshowResults(newResults);
      }
    } catch (error) {
      console.error("Storyboard error:", error);
      alert("Failed to generate storyboard. Check your connection/key.");
    } finally {
      setIsCreatingStoryboard(false);
    }
  };

  const handleRegenerate = async (index: number) => {
    if (references.length === 0) {
      alert("Please upload at least one reference image for character consistency.");
      return;
    }

    const setter = mode === 'slideshow' ? setSlideshowResults : setManualResults;
    const currentList = mode === 'slideshow' ? slideshowResults : manualResults;
    const targetResult = currentList[index];
    
    if (!targetResult || targetResult.isCTA) return;

    // Set specific item to loading
    setter(prev => prev.map((res, idx) => idx === index ? { ...res, isLoading: true, error: undefined } : res));

    try {
      const imageUrl = await generateCharacterScene(targetResult.prompt, references, size);
      setter(prev => prev.map((res, idx) => 
        idx === index ? { ...res, imageUrl, isLoading: false } : res
      ));
    } catch (error: any) {
      console.error("Regeneration error:", error);
      if (error.message === 'KEY_NOT_FOUND') {
        setHasKey(false);
      }
      setter(prev => prev.map((res, idx) => 
        idx === index ? { ...res, error: error.message || 'Generation failed', isLoading: false } : res
      ));
    }
  };

  const startGeneration = async () => {
    if (references.length === 0) {
      alert("Please upload at least one reference image for character consistency.");
      return;
    }

    setIsGenerating(true);

    if (mode === 'manual') {
      const promptList = manualPrompts.split('\n').filter(p => p.trim() !== '');
      if (promptList.length === 0) {
        alert("Please enter some manual prompts.");
        setIsGenerating(false);
        return;
      }
      
      const initialManualResults = promptList.map(p => ({ prompt: p, isLoading: true }));
      setManualResults(initialManualResults);

      for (let i = 0; i < initialManualResults.length; i++) {
        try {
          const imageUrl = await generateCharacterScene(promptList[i], references, size);
          setManualResults(prev => prev.map((res, idx) => 
            idx === i ? { ...res, imageUrl, isLoading: false } : res
          ));
        } catch (error: any) {
          console.error("Manual generation error:", error);
          if (error.message === 'KEY_NOT_FOUND') { setHasKey(false); break; }
          setManualResults(prev => prev.map((res, idx) => idx === i ? { ...res, error: error.message, isLoading: false } : res));
        }
      }
    } else {
      if (slideshowResults.length === 0) {
        alert("Please create a storyboard first.");
        setIsGenerating(false);
        return;
      }

      setSlideshowResults(prev => prev.map(res => ({ ...res, isLoading: !res.isCTA && !res.imageUrl })));

      for (let i = 0; i < slideshowResults.length; i++) {
        const currentRes = slideshowResults[i];
        if (currentRes.isCTA || currentRes.imageUrl) continue;

        try {
          const imageUrl = await generateCharacterScene(currentRes.prompt, references, size);
          setSlideshowResults(prev => prev.map((res, idx) => 
            idx === i ? { ...res, imageUrl, isLoading: false } : res
          ));
        } catch (error: any) {
          console.error("Slideshow generation error:", error);
          if (error.message === 'KEY_NOT_FOUND') { setHasKey(false); break; }
          setSlideshowResults(prev => prev.map((res, idx) => idx === i ? { ...res, error: error.message, isLoading: false } : res));
        }
      }
    }
    
    setIsGenerating(false);
  };

  if (hasKey === false) {
    return <ApiKeyGuard onKeySelected={() => setHasKey(true)} />;
  }

  if (hasKey === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600 font-medium">Checking API configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Consistency Studio</h1>
          </div>
          
          <div className="flex-1 flex justify-center">
            <div className="bg-slate-100 p-1 rounded-xl flex shadow-inner">
              <button 
                onClick={() => setMode('slideshow')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'slideshow' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Slideshow Mode
              </button>
              <button 
                onClick={() => setMode('manual')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Manual Generation
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden lg:flex items-center gap-2 mr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Res</span>
              <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                {(['1K', '2K', '4K'] as ImageSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    disabled={isGenerating}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${size === s ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={startGeneration}
              disabled={isGenerating || references.length === 0}
              className={`px-6 py-2 rounded-xl font-bold transition-all shadow-md ${
                isGenerating || references.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200'
              }`}
            >
              {isGenerating ? 'Processing...' : 'Generate Images'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-4 gap-8 overflow-hidden">
        {/* Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          {/* Reference Images Section */}
          <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">References</h3>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase"
              >
                Upload
              </button>
            </div>
            <input type="file" ref={fileInputRef} multiple className="hidden" accept="image/*" onChange={handleFileUpload} />
            
            {references.length === 0 ? (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-100 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 bg-slate-50 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300 mx-auto mb-2 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Add Character Images</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {references.map((ref) => (
                  <div key={ref.id} className="relative aspect-square rounded-lg overflow-hidden group border border-slate-100 shadow-sm">
                    <img src={ref.data} className="w-full h-full object-cover" />
                    <button onClick={() => removeReference(ref.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Input Controls based on Mode */}
          <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex-1 flex flex-col">
            {mode === 'slideshow' ? (
              <>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Slideshow Story</h3>
                <div className="space-y-4 flex-1 flex flex-col">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-tight">Overall Topic</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g. Benefits of Yoga"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateStoryboard}
                    disabled={isCreatingStoryboard || !topic.trim()}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 disabled:bg-slate-200 transition-all shadow-md shadow-blue-100"
                  >
                    {isCreatingStoryboard ? 'Creating Script...' : 'Generate Storyboard'}
                  </button>
                  <div className="pt-4 border-t border-slate-100 mt-auto">
                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">This will automatically create a title slide, informative slides, and a CTA slide.</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Manual Scenarios</h3>
                <textarea
                  value={manualPrompts}
                  onChange={(e) => setManualPrompts(e.target.value)}
                  placeholder="One scene prompt per line..."
                  className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
                <p className="text-[10px] text-slate-400 mt-3 font-medium uppercase">Describe actions, emotions, and props.</p>
              </>
            )}
          </section>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 overflow-hidden flex flex-col">
          <div className="bg-slate-50 rounded-3xl p-8 flex-1 flex flex-col overflow-hidden border border-slate-200 shadow-inner">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              {mode === 'slideshow' ? 'Slideshow Timeline' : 'Generated Scenes'}
              {isGenerating && (
                <span className="text-xs font-normal text-slate-500 animate-pulse bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  Rendering Set...
                </span>
              )}
            </h2>

            {(mode === 'slideshow' ? slideshowResults : manualResults).length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-slate-600">No Content Ready</p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Upload references and {mode === 'slideshow' ? 'create a storyboard' : 'input prompts'}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto custom-scrollbar pb-6">
                <div className="flex gap-6 min-w-max h-full items-stretch p-2">
                  {(mode === 'slideshow' ? slideshowResults : manualResults).map((result, idx) => {
                    const isFirstSlide = mode === 'slideshow' && idx === 0;
                    return (
                      <div 
                        key={idx} 
                        className={`w-96 bg-white rounded-2xl p-6 shadow-xl border flex flex-col transition-all hover:translate-y-[-4px] ${
                          result.isCTA ? 'border-blue-200 bg-blue-50/20' : 'border-white'
                        }`}
                      >
                        {/* Image Preview Container */}
                        {!result.isCTA && (
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-50 mb-6 group">
                            {result.isLoading ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-white/60 backdrop-blur-sm">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Illustrating...</p>
                              </div>
                            ) : result.imageUrl ? (
                              <>
                                <img src={result.imageUrl} alt={`Result ${idx + 1}`} className="w-full h-full object-contain" />
                                <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleRegenerate(idx)}
                                    className="bg-white/90 backdrop-blur shadow-sm p-2 rounded-lg hover:bg-white text-slate-700 transition-all active:scale-95"
                                    title="Regenerate this scene"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                  </button>
                                  <a 
                                    href={result.imageUrl} 
                                    download={`scene-${idx + 1}.png`}
                                    className="bg-white/90 backdrop-blur shadow-sm p-2 rounded-lg hover:bg-white text-slate-700 transition-all active:scale-95"
                                    title="Download PNG"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </a>
                                </div>
                              </>
                            ) : result.error ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-red-50">
                                <p className="text-[10px] font-black uppercase mb-1 text-red-500">Error</p>
                                <p className="text-[10px] leading-relaxed text-red-400 italic mb-4">"{result.error}"</p>
                                <button 
                                  onClick={() => handleRegenerate(idx)}
                                  className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors shadow-sm"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Retry
                                </button>
                              </div>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-300">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                 </svg>
                                 <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Awaiting Generation</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* CTA placeholder for slideshow */}
                        {result.isCTA && (
                          <div className="h-48 flex items-center justify-center mb-6 bg-blue-100/50 rounded-2xl border-2 border-dashed border-blue-200">
                             <div className="text-center">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white shadow-lg shadow-blue-200">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </div>
                                <p className="text-blue-800 font-black uppercase text-xs tracking-widest">Action Slide</p>
                             </div>
                          </div>
                        )}
                        
                        {/* Slide Content */}
                        <div className="flex-1 flex flex-col">
                          <div className="flex items-start gap-3 mb-4">
                            <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black shadow-sm ${
                              result.isCTA ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'
                            }`}>
                              {idx + 1}
                            </span>
                            <h3 className={`font-black text-slate-900 leading-tight tracking-tight ${isFirstSlide ? 'text-2xl' : 'text-lg'}`}>
                              {result.title || (mode === 'manual' ? `Scene ${idx + 1}` : `Slide ${idx + 1}`)}
                            </h3>
                          </div>
                          
                          {/* Descriptions only on non-first content slides or CTA */}
                          {(!isFirstSlide && result.description) && (
                            <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
                              {result.description}
                            </p>
                          )}

                          {/* Manual mode simple prompt display */}
                          {mode === 'manual' && (
                            <p className="text-sm text-slate-600 leading-relaxed font-medium mb-4">
                              {result.prompt}
                            </p>
                          )}

                          {!result.isCTA && (
                            <div className="mt-auto pt-4 border-t border-slate-50">
                               <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Character Guidance</div>
                               <p className="text-[11px] text-slate-400 italic leading-snug line-clamp-2">"{result.prompt}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 px-6 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-widest gap-4">
          <p>© 2024 Consistency Studio — Gemini 3 Pro Engine</p>
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Character Identity Locked
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Lifestack Slideshow Optimized
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
