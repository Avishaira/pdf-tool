/**
 * PDF Master Tool - Ultimate Edition (AdSense Ready)
 */

// Global Variables
const { useState, useEffect, useCallback, useRef } = React;

/* --- ADSENSE CONFIGURATION --- */
// 1. הדבק כאן את המספר שלך (במקום ה-Xים)
const AD_PUB_ID = "ca-pub-4733393000264287"; 

// 2. מספרי ה-Slot (תוכל לעדכן אותם כשתקבל אותם מגוגל, כרגע השאר אותם כך)
const AD_SLOT_SIDEBAR = "1234567890"; 
const AD_SLOT_MOBILE  = "1234567890"; 

/* ========================================================================
   1. DOMAIN LOGIC
   ======================================================================== */
const PDFEngine = {
    async loadFile(file) {
        const buffer = await file.arrayBuffer();
        const doc = await window.PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
        return {
            id: crypto.randomUUID(),
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            pageCount: doc.getPageCount(),
            buffer,
            range: `1-${doc.getPageCount()}`
        };
    },
    parsePageIndices(rangeStr, totalPages) {
        const indices = new Set();
        rangeStr.split(',').forEach(part => {
            const clean = part.trim();
            if (clean.includes('-')) {
                let [start, end] = clean.split('-').map(n => parseInt(n));
                if (isNaN(start)) start = 1; 
                if (isNaN(end)) end = totalPages;
                start = Math.max(1, start);
                end = Math.min(totalPages, end);
                if (start <= end) for (let i = start; i <= end; i++) indices.add(i - 1);
            } else {
                const num = parseInt(clean);
                if (!isNaN(num) && num >= 1 && num <= totalPages) indices.add(num - 1);
            }
        });
        return Array.from(indices).sort((a, b) => a - b);
    },
    triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};

/* ========================================================================
   2. UI COMPONENTS & ADS
   ======================================================================== */

// Ad Unit Component
const AdUnit = ({ slot, style, format = "auto" }) => {
    useEffect(() => {
        try {
            if (AD_PUB_ID !== "ca-pub-XXXXXXXXXXXXXXXX") {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
        } catch (e) { console.log("AdSense error (normal if blocked):", e); }
    }, []);

    // Placeholder until real ID is set
    if (AD_PUB_ID === "ca-pub-XXXXXXXXXXXXXXXX") {
        return <div className="w-full h-full bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs font-mono p-2">Ad Space</div>;
    }

    return (
        <ins className="adsbygoogle"
             style={{ display: 'block', ...style }}
             data-ad-client={AD_PUB_ID}
             data-ad-slot={slot}
             data-ad-format={format}
             data-full-width-responsive="true"></ins>
    );
};

const Icon = ({ d, spin }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${spin ? 'animate-spin' : ''}`}>
        <path d={d} />
    </svg>
);

const Icons = {
    Plus: () => <Icon d="M12 5v14M5 12h14" />,
    Layers: () => <Icon d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
    Scissors: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8" y2="16"/><line x1="20" y1="20" x2="8" y2="8"/></svg>,
    Trash: () => <Icon d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
    Download: () => <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
    Upload: () => <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
    Loader: () => <Icon spin d="M21 12a9 9 0 1 1-6.219-8.56" />,
    Up: () => <Icon d="M18 15l-6-6-6 6" />,
    Down: () => <Icon d="M6 9l6 6 6-6" />,
    X: () => <Icon d="M18 6L6 18M6 6l12 12" />
};

const Button = ({ children, variant = 'primary', disabled, onClick, className = '' }) => {
    const base = "px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
    const styles = {
        primary: "bg-primary-600 text-white shadow-lg hover:bg-primary-700",
        secondary: "bg-white text-slate-700 border border-slate-200 hover:border-primary-500 hover:text-primary-600",
        danger: "text-red-400 hover:text-red-600 hover:bg-red-50 p-2",
        ghost: "text-slate-400 hover:text-primary-600 p-1"
    };
    return <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>{children}</button>;
};

const Card = ({ children, className = '' }) => (
    <div className={`bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden ${className}`}>{children}</div>
);

const Badge = ({ children, type = 'neutral' }) => {
    const styles = { neutral: "bg-slate-100 text-slate-500", success: "bg-green-100 text-green-700", loading: "bg-primary-100 text-primary-700" };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${styles[type]}`}>{children}</span>;
};

/* ========================================================================
   3. FEATURES
   ======================================================================== */

const MergeFeature = ({ isReady }) => {
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState('idle');
    const fileInputRef = useRef(null);

    const handleUpload = async (e) => {
        const newFiles = Array.from(e.target.files);
        if (!newFiles.length) return;
        setStatus('processing');
        try {
            const processed = await Promise.all(newFiles.map(PDFEngine.loadFile));
            setFiles(p => [...p, ...processed]);
            setStatus('idle');
        } catch (e) { alert("Error reading file"); setStatus('error'); }
        e.target.value = '';
    };

    const handleMerge = async () => {
        if (!files.length) return;
        setStatus('processing');
        try {
            const merged = await window.PDFLib.PDFDocument.create();
            for (const f of files) {
                const src = await window.PDFLib.PDFDocument.load(f.buffer, { ignoreEncryption: true });
                const indices = PDFEngine.parsePageIndices(f.range, f.pageCount);
                if (indices.length) {
                    const pgs = await merged.copyPages(src, indices);
                    pgs.forEach(p => merged.addPage(p));
                }
            }
            PDFEngine.triggerDownload(await merged.save(), 'merged.pdf');
            setStatus('idle');
        } catch (e) { alert("Merge failed"); setStatus('error'); }
    };

    const move = (idx, dir) => {
        const arr = [...files];
        if (dir === -1 && idx > 0) [arr[idx], arr[idx-1]] = [arr[idx-1], arr[idx]];
        else if (dir === 1 && idx < arr.length-1) [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]];
        setFiles(arr);
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold text-slate-800">Merge Workspace</h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Button variant="secondary" className="w-full justify-center" disabled={!isReady || status === 'processing'} onClick={() => fileInputRef.current.click()}>
                            <Icons.Plus /> Add Files
                        </Button>
                        <input ref={fileInputRef} type="file" multiple accept=".pdf" className="hidden" onChange={handleUpload} />
                    </div>
                    {files.length > 0 && (
                        <Button variant="primary" className="flex-1 md:flex-none justify-center" onClick={handleMerge} disabled={status === 'processing'}>
                            {status === 'processing' ? <Icons.Loader /> : <Icons.Layers />} Merge PDF
                        </Button>
                    )}
                </div>
            </div>
            
            {files.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                    <div className="text-slate-300 mb-2 flex justify-center"><div className="w-12 h-12"><Icons.Upload /></div></div>
                    <p className="text-slate-500 font-medium">No files selected</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {files.map((f, i) => (
                        <div key={f.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-4">
                            <div className="flex flex-col">
                                <Button variant="ghost" onClick={() => move(i, -1)} disabled={i===0}><Icons.Up /></Button>
                                <Button variant="ghost" onClick={() => move(i, 1)} disabled={i===files.length-1}><Icons.Down /></Button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="font-bold truncate">{f.name}</div>
                                <div className="text-xs text-slate-500">{f.pageCount} Pages • {f.size}</div>
                            </div>
                            <input className="w-24 p-2 border rounded-lg text-sm" value={f.range} onChange={e => {
                                const n = [...files]; n[i].range = e.target.value; setFiles(n);
                            }} />
                            <Button variant="danger" onClick={() => setFiles(files.filter((_, x) => x !== i))}><Icons.Trash /></Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SplitFeature = ({ isReady }) => {
    const [file, setFile] = useState(null);
    const [ranges, setRanges] = useState([{id: 1, val: ''}]);
    const [status, setStatus] = useState('idle');

    const handleUpload = async (e) => {
        if (!e.target.files[0]) return;
        setStatus('processing');
        try {
            const f = await PDFEngine.loadFile(e.target.files[0]);
            setFile(f);
            setRanges([{id: 1, val: `1-${f.pageCount}`}]);
            setStatus('idle');
        } catch(e) { alert("Error reading file"); setStatus('error'); }
        e.target.value = '';
    };

    const handleSplit = async (mode) => {
        if (!file) return;
        setStatus('processing');
        try {
            const src = await window.PDFLib.PDFDocument.load(file.buffer, { ignoreEncryption: true });
            const zip = new window.JSZip();
            const name = file.name.replace(/\.pdf$/i, '');

            if (mode === 'burst') {
                for (let i = 0; i < file.pageCount; i++) {
                    const d = await window.PDFLib.PDFDocument.create();
                    const [p] = await d.copyPages(src, [i]);
                    d.addPage(p);
                    zip.file(`${name}_page_${i+1}.pdf`, await d.save());
                }
            } else {
                for (const r of ranges) {
                    const idxs = PDFEngine.parsePageIndices(r.val, file.pageCount);
                    if (idxs.length) {
                        const d = await window.PDFLib.PDFDocument.create();
                        const pgs = await d.copyPages(src, idxs);
                        pgs.forEach(p => d.addPage(p));
                        zip.file(`${name}_split_${r.id}.pdf`, await d.save());
                    }
                }
            }
            PDFEngine.triggerDownload(await zip.generateAsync({type:"blob"}), `${name}_split.zip`);
            setStatus('idle');
        } catch(e) { alert("Split failed"); setStatus('error'); }
    };

    return (
        <div className="p-6">
            {!file ? (
                <label className={`block text-center py-20 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 ${!isReady && 'opacity-50'}`}>
                    <div className="flex justify-center text-slate-400 mb-4"><div className="w-12 h-12"><Icons.Upload /></div></div>
                    <h3 className="font-bold text-slate-700">Upload PDF to Split</h3>
                    <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={!isReady} />
                </label>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="bg-white border p-4 rounded-xl flex justify-between items-center">
                        <div>
                            <div className="font-bold">{file.name}</div>
                            <div className="text-xs text-slate-500">{file.pageCount} Pages</div>
                        </div>
                        <Button variant="danger" onClick={() => setFile(null)}>Close</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="secondary" onClick={() => handleSplit('burst')} disabled={status === 'processing'}>
                            {status === 'processing' ? <Icons.Loader /> : <Icons.Layers />} Burst All
                        </Button>
                        <Button variant="primary" onClick={() => handleSplit('custom')} disabled={status === 'processing'}>
                            {status === 'processing' ? <Icons.Loader /> : <Icons.Download />} Download Ranges
                        </Button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold text-sm">Ranges</span>
                            <button onClick={() => setRanges([...ranges, {id: Date.now(), val: ''}])} className="text-primary-600 text-sm font-bold">+ Add</button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {ranges.map(r => (
                                <div key={r.id} className="flex gap-3">
                                    <input className="flex-1 border rounded-lg p-2" placeholder="e.g. 1-5" value={r.val} onChange={e => {
                                        const n = [...ranges]; n.find(x=>x.id===r.id).val = e.target.value; setRanges(n);
                                    }} />
                                    <Button variant="ghost" onClick={() => ranges.length > 1 && setRanges(ranges.filter(x => x.id !== r.id))}><Icons.X className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- APP SHELL ---
const App = () => {
    const [tab, setTab] = useState('merge');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const check = () => {
            if (window.PDFLib && window.JSZip) setReady(true);
            else requestAnimationFrame(check);
        };
        check();
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-12 grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-8 items-start">
                
                {/* Left Ad */}
                <aside className="hidden lg:block sticky top-8 h-[600px] bg-white rounded-2xl border border-dashed border-slate-200 overflow-hidden">
                    <AdUnit slot={AD_SLOT_SIDEBAR} style={{ width: '100%', height: '100%' }} />
                </aside>

                {/* Main Content */}
                <div className="flex flex-col min-w-0 w-full">
                    {/* Mobile Top Ad */}
                    <div className="lg:hidden w-full h-[100px] bg-slate-100 rounded-xl mb-6 overflow-hidden">
                        <AdUnit slot={AD_SLOT_MOBILE} style={{ width: '100%', height: '100px' }} />
                    </div>

                    <header className="text-center mb-10">
                        <div className="inline-block p-3 bg-primary-600 rounded-2xl shadow-lg mb-4 text-white"><div className="w-8 h-8"><Icons.Layers /></div></div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">PDF Master Tool</h1>
                        <p className="text-lg text-slate-500 max-w-lg mx-auto">Free. Private. Serverless.</p>
                    </header>

                    <nav className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex w-full max-w-sm mx-auto mb-8">
                        {['merge', 'split'].map(t => (
                            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize flex justify-center gap-2 transition-all ${tab === t ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>
                                {t === 'merge' ? <Icons.Layers className="w-4 h-4" /> : <Icons.Scissors className="w-4 h-4" />} {t}
                            </button>
                        ))}
                    </nav>

                    <Card className="min-h-[500px] mb-16 relative">
                        {tab === 'merge' ? <MergeFeature isReady={ready} /> : <SplitFeature isReady={ready} />}
                    </Card>

                    {/* Mobile Bottom Ad */}
                    <div className="lg:hidden w-full h-[250px] bg-slate-100 rounded-xl mb-8 overflow-hidden">
                        <AdUnit slot={AD_SLOT_MOBILE} style={{ width: '100%', height: '250px' }} />
                    </div>

                    <footer className="text-center pb-8 flex flex-col items-center gap-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm">
                            <Badge type={ready ? 'success' : 'loading'}>{ready ? 'SYSTEM ONLINE' : 'INITIALIZING'}</Badge>
                            <span className="text-xs text-slate-400 font-medium ml-2">v2.1 Ad-Ready</span>
                        </div>
                        <div className="text-xs text-slate-400">
                            &copy; {new Date().getFullYear()} PDF Master. <a href="legal.html" className="underline hover:text-primary-600">Privacy Policy</a>
                        </div>
                    </footer>
                </div>

                {/* Right Ad */}
                <aside className="hidden lg:block sticky top-8 h-[600px] bg-white rounded-2xl border border-dashed border-slate-200 overflow-hidden">
                    <AdUnit slot={AD_SLOT_SIDEBAR} style={{ width: '100%', height: '100%' }} />
                </aside>

            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
