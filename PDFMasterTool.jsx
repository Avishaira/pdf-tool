import React, { useState, useEffect } from 'react';
import { Upload, FileText, ArrowUp, ArrowDown, X, Layers, Scissors, Download, Plus, Trash2, AlertCircle, CheckCircle, Loader2, Shield, Zap, Globe, Cpu } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('merge');
  const [isEngineReady, setIsEngineReady] = useState(false);

  // --- ENGINE LOADING LOGIC ---
  useEffect(() => {
    // 1. Check every 100ms if the libraries exist
    const checkInterval = setInterval(() => {
      if (window.PDFLib && window.JSZip) {
        setIsEngineReady(true);
        clearInterval(checkInterval);
      }
    }, 100);

    // 2. Failsafe: If not loaded in 2 seconds, force manual download
    const backupTimeout = setTimeout(() => {
      if (!window.PDFLib || !window.JSZip) {
        console.log("Injecting backup libraries...");
        if (!window.PDFLib) {
          const s = document.createElement('script');
          s.src = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
          document.head.appendChild(s);
        }
        if (!window.JSZip) {
          const s = document.createElement('script');
          s.src = "https://unpkg.com/jszip@3.10.1/dist/jszip.min.js";
          document.head.appendChild(s);
        }
      }
    }, 2000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(backupTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-700 flex flex-col">
      
      {/* Main Grid Layout */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-[250px_1fr_250px] gap-8 items-start">
        
        {/* Left Ad Space */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-8 h-[calc(100vh-4rem)]">
          <div className="bg-white/50 border border-slate-200 border-dashed rounded-xl h-full flex items-center justify-center text-slate-400 text-sm font-medium">
            Google Ad (160x600)
          </div>
        </aside>

        {/* Center Tool */}
        <div className="w-full flex flex-col min-w-0">
          
          <header className="mb-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                <Layers className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
              {activeTab === 'merge' ? 'Merge PDF Files' : 'Split PDF Files'}
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
              The best free online tool to {activeTab === 'merge' ? 'combine multiple PDFs into one' : 'extract pages from your PDF'}. 
              <span className="hidden sm:inline"> Private, secure, and runs entirely in your browser.</span>
            </p>
          </header>

          {/* Tabs */}
          <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 max-w-md mx-auto mb-8 flex w-full">
            <button
              onClick={() => setActiveTab('merge')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === 'merge' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" /> Merge PDFs
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === 'split' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Scissors className="w-4 h-4" /> Split PDF
            </button>
          </div>

          {/* Workspace */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[500px] mb-12 relative z-10">
            {activeTab === 'merge' ? 
              <MergeTool isReady={isEngineReady} /> : 
              <SplitTool isReady={isEngineReady} />
            }
          </div>

          {/* SEO Text */}
          <section className="prose prose-slate max-w-none bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm">
             <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Globe className="w-6 h-6 text-indigo-500" /> Why use PDF Master?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">100% Secure & Private</h3>
                <p className="text-slate-600 text-sm leading-relaxed">We never upload your files.</p>
              </div>
              <div>
                <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Lightning Fast</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Zero wait times.</p>
              </div>
              <div>
                <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Completely Free</h3>
                <p className="text-slate-600 text-sm leading-relaxed">No hidden costs.</p>
              </div>
            </div>
          </section>

          <footer className="mt-12 text-center text-slate-400 text-sm pb-8 flex flex-col items-center gap-2">
            <p>&copy; {new Date().getFullYear()} PDF Master. All rights reserved.</p>
            <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full transition-colors ${
              isEngineReady ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {isEngineReady ? <Cpu className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
              Status: {isEngineReady ? 'Engine Ready' : 'Loading Libraries...'}
            </div>
          </footer>
        </div>

        {/* Right Ad Space */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-8 h-[calc(100vh-4rem)]">
          <div className="bg-white/50 border border-slate-200 border-dashed rounded-xl h-full flex items-center justify-center text-slate-400 text-sm font-medium">
            Google Ad (160x600)
          </div>
        </aside>

      </main>
    </div>
  );
};

// --- MERGE LOGIC ---
const MergeTool = ({ isReady }) => {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length === 0) return;
    setError(null);
    setIsProcessing(true);

    try {
      if (!window.PDFLib) throw new Error("Engine loading...");
      const results = await Promise.allSettled(
        uploadedFiles.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await window.PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          return {
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            pageCount: pdfDoc.getPageCount(),
            range: `1-${pdfDoc.getPageCount()}`,
            arrayBuffer
          };
        })
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      if (successful.length < uploadedFiles.length) setError("Some files failed to load (password protected or corrupted).");
      setFiles(prev => [...prev, ...successful]);
    } catch (err) {
      setError("Error loading files.");
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const mergePDFs = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const mergedPdf = await window.PDFLib.PDFDocument.create();
      for (const fileData of files) {
        const srcDoc = await window.PDFLib.PDFDocument.load(fileData.arrayBuffer, { ignoreEncryption: true });
        const indices = parsePageRange(fileData.range, fileData.pageCount);
        if (indices.length > 0) {
          const copied = await mergedPdf.copyPages(srcDoc, indices);
          copied.forEach(page => mergedPdf.addPage(page));
        }
      }
      downloadBlob(await mergedPdf.save(), 'merged_document.pdf', 'application/pdf');
    } catch (err) {
      setError("Merge failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions for UI interaction
  const moveFile = (index, direction) => {
    const newFiles = [...files];
    if (direction === 'up' && index > 0) [newFiles[index], newFiles[index-1]] = [newFiles[index-1], newFiles[index]];
    if (direction === 'down' && index < newFiles.length-1) [newFiles[index], newFiles[index+1]] = [newFiles[index+1], newFiles[index]];
    setFiles(newFiles);
  };
  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };
  const updateRange = (id, newRange) => setFiles(files.map(f => f.id === id ? { ...f, range: newRange } : f));

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <h2 className="text-xl font-bold text-slate-800">Files to Merge</h2>
        <div className="flex gap-3">
           <label className={`cursor-pointer bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 ${!isReady ? 'opacity-50' : 'hover:border-indigo-300 text-indigo-600'}`}>
            {isReady ? <Plus className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />} Add Files
            <input type="file" multiple accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={!isReady} />
          </label>
          {files.length > 0 && (
            <button onClick={mergePDFs} disabled={isProcessing || !isReady} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />} Merge PDFs
            </button>
          )}
        </div>
      </div>
      {error && <div className="mb-6 text-red-600 bg-red-50 p-3 rounded-xl text-sm">{error}</div>}
      
      {files.length === 0 ? <EmptyState icon={Layers} title="Drop files here" description="Upload PDFs to combine them." /> : (
        <div className="space-y-3">
          {files.map((file, idx) => (
            <div key={file.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
              <div className="flex flex-col items-center gap-1 text-slate-300">
                <button onClick={() => moveFile(idx, 'up')} disabled={idx === 0}><ArrowUp className="w-4 h-4 hover:text-indigo-600" /></button>
                <span className="text-xs font-mono">{idx + 1}</span>
                <button onClick={() => moveFile(idx, 'down')} disabled={idx === files.length - 1}><ArrowDown className="w-4 h-4 hover:text-indigo-600" /></button>
              </div>
              <div className="flex-1 w-full text-center md:text-left">
                <h4 className="font-bold text-slate-800 truncate">{file.name}</h4>
                <p className="text-xs text-slate-400">{file.pageCount} pages • {file.size}</p>
              </div>
              <input type="text" value={file.range} onChange={(e) => updateRange(file.id, e.target.value)} className="w-full md:w-48 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <button onClick={() => removeFile(idx)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- SPLIT LOGIC ---
const SplitTool = ({ isReady }) => {
  const [file, setFile] = useState(null);
  const [splitMode, setSplitMode] = useState('single');
  const [customRanges, setCustomRanges] = useState([{ id: 1, label: 'Range 1', value: '' }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setIsProcessing(true);
    try {
      if (!window.PDFLib) throw new Error("Wait for engine...");
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const pdfDoc = await window.PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setFile({
        file: uploadedFile, name: uploadedFile.name,
        size: (uploadedFile.size / 1024 / 1024).toFixed(2) + ' MB',
        pageCount: pdfDoc.getPageCount(), arrayBuffer
      });
      setCustomRanges([{ id: 1, label: 'Range 1', value: `1-${pdfDoc.getPageCount()}` }]);
    } catch (err) { setError("Failed to read PDF."); } 
    finally { setIsProcessing(false); e.target.value = ''; }
  };

  const executeSplit = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const srcDoc = await window.PDFLib.PDFDocument.load(file.arrayBuffer, { ignoreEncryption: true });
      const zip = new window.JSZip();
      const baseName = file.name.replace(/\.pdf$/i, '');

      if (splitMode === 'single') {
        for (let i = 0; i < file.pageCount; i++) {
          const newDoc = await window.PDFLib.PDFDocument.create();
          const [copied] = await newDoc.copyPages(srcDoc, [i]);
          newDoc.addPage(copied);
          zip.file(`${baseName}_page_${i + 1}.pdf`, await newDoc.save());
        }
      } else {
        for (const range of customRanges) {
           const indices = parsePageRange(range.value, file.pageCount);
           if (indices.length > 0) {
             const newDoc = await window.PDFLib.PDFDocument.create();
             const copied = await newDoc.copyPages(srcDoc, indices);
             copied.forEach(p => newDoc.addPage(p));
             zip.file(`${baseName}_${range.label}.pdf`, await newDoc.save());
           }
        }
      }
      downloadBlob(await zip.generateAsync({ type: "blob" }), `${baseName}_split.zip`, 'application/zip');
    } catch (err) { setError("Split failed."); }
    finally { setIsProcessing(false); }
  };

  const addRange = () => setCustomRanges([...customRanges, { id: Date.now(), label: `Range ${customRanges.length + 1}`, value: '' }]);
  const removeRange = (id) => customRanges.length > 1 && setCustomRanges(customRanges.filter(r => r.id !== id));
  const updateRangeValue = (id, val) => setCustomRanges(customRanges.map(r => r.id === id ? { ...r, value: val } : r));

  return (
    <div className="p-8">
      {!file ? (
        <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed border-slate-300 rounded-2xl hover:border-indigo-400 group relative">
          <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" id="split-upload" disabled={!isReady} />
          <label htmlFor="split-upload" className={`cursor-pointer flex flex-col items-center w-full h-full justify-center ${!isReady ? 'opacity-50' : ''}`}>
            <div className="p-5 bg-white rounded-2xl shadow-sm mb-4 text-indigo-500">
               {isReady ? <Upload className="w-10 h-10" /> : <Loader2 className="w-10 h-10 animate-spin" />}
            </div>
            <p className="text-xl font-bold text-slate-700">{isReady ? 'Click to upload PDF' : 'Loading...'}</p>
          </label>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
           <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-800 truncate">{file.name}</h3>
              <p className="text-xs text-slate-500">{file.pageCount} Pages • {file.size}</p>
              <button onClick={() => setFile(null)} className="text-xs text-red-500 font-bold mt-2">Change File</button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => setSplitMode('single')} className={`p-4 rounded-xl border text-left ${splitMode === 'single' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2 font-bold text-slate-800"><Layers className="w-4 h-4" /> Extract All Pages</div>
              </button>
              <button onClick={() => setSplitMode('ranges')} className={`p-4 rounded-xl border text-left ${splitMode === 'ranges' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                 <div className="flex items-center gap-2 font-bold text-slate-800"><Scissors className="w-4 h-4" /> Custom Ranges</div>
              </button>
            </div>
            <button onClick={executeSplit} disabled={isProcessing || !isReady} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download
            </button>
          </div>
          <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-100 p-6">
            {splitMode === 'single' ? <div className="text-center opacity-60 mt-10">Creates {file.pageCount} separate files.</div> : (
              <div className="space-y-3 overflow-y-auto max-h-[400px]">
                 <div className="flex justify-between mb-4"><h4 className="font-bold">Ranges</h4><button onClick={addRange} className="text-indigo-600 text-sm font-bold flex gap-1"><Plus className="w-4 h-4" /> Add</button></div>
                 {customRanges.map(r => (
                   <div key={r.id} className="flex gap-3 items-center">
                     <span className="text-xs font-bold w-16">{r.label}</span>
                     <input type="text" value={r.value} onChange={(e) => updateRangeValue(r.id, e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm" />
                     <button onClick={() => removeRange(r.id)} disabled={customRanges.length===1}><X className="w-4 h-4 text-slate-400" /></button>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helpers
const EmptyState = ({ icon: I, title, description }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="p-6 bg-slate-50 rounded-3xl mb-6"><I className="w-12 h-12 text-slate-300" /></div>
    <h3 className="text-xl font-bold text-slate-800">{title}</h3>
    <p className="text-slate-500 max-w-md">{description}</p>
  </div>
);
const parsePageRange = (str, max) => {
  const p = new Set();
  str.split(',').forEach(x => {
    if (x.includes('-')) {
      let [s, e] = x.split('-').map(n => parseInt(n));
      if (isNaN(s)) s=1; if (isNaN(e)) e=max;
      for (let i=Math.max(1,s); i<=Math.min(max,e); i++) p.add(i-1);
    } else {
      let n = parseInt(x);
      if (!isNaN(n) && n>=1 && n<=max) p.add(n-1);
    }
  });
  return Array.from(p).sort((a,b)=>a-b);
};
const downloadBlob = (d, n, t) => {
  const u = window.URL.createObjectURL(new Blob([d], {type:t}));
  const l = document.createElement('a'); l.href=u; l.download=n;
  document.body.appendChild(l); l.click(); document.body.removeChild(l);
};

export default App;


