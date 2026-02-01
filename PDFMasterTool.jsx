/**
 * PDF Master Tool
 * ------------------------------------------------------------------
 * A serverless, client-side React application for PDF manipulation.
 */

// Global Scope Variables (Provided by scripts in index.html)
const { useState, useEffect, useCallback, useMemo, useRef } = React;

/* ========================================================================
   1. DOMAIN LAYER (Business Logic & Services)
   ======================================================================== */

const PDFEngine = {
    /**
     * Converts a File object into a processed internal format.
     * @param {File} file 
     * @returns {Promise<Object>} Processed file metadata and buffer
     */
    async loadFile(file) {
        try {
            const buffer = await file.arrayBuffer();
            // 'ignoreEncryption' allows reading metadata even if password-protected
            const doc = await window.PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
            
            return {
                id: crypto.randomUUID(),
                originalFile: file,
                name: file.name,
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                pageCount: doc.getPageCount(),
                buffer: buffer, // Keep in memory for processing
                range: `1-${doc.getPageCount()}` // Default to all pages
            };
        } catch (error) {
            console.error("PDFEngine Load Error:", error);
            throw new Error(`Failed to parse "${file.name}". The file may be corrupted or encrypted.`);
        }
    },

    /**
     * Parses a page range string (e.g., "1-3, 5") into zero-based indices.
     * @param {string} rangeStr - User input string
     * @param {number} totalPages - Total pages in document
     * @returns {number[]} Array of zero-based page indices
     */
    parsePageIndices(rangeStr, totalPages) {
        const indices = new Set();
        const parts = rangeStr.split(',');

        parts.forEach(part => {
            const cleanPart = part.trim();
            if (cleanPart.includes('-')) {
                let [start, end] = cleanPart.split('-').map(n => parseInt(n));
                if (isNaN(start)) start = 1;
                if (isNaN(end)) end = totalPages;
                
                // Clamp values to valid range
                start = Math.max(1, start);
                end = Math.min(totalPages, end);

                if (start <= end) {
                    for (let i = start; i <= end; i++) indices.add(i - 1);
                }
            } else {
                const num = parseInt(cleanPart);
                if (!isNaN(num) && num >= 1 && num <= totalPages) {
                    indices.add(num - 1);
                }
            }
        });

        return Array.from(indices).sort((a, b) => a - b);
    },

    /**
     * Downloads a Blob to the user's device.
     */
    triggerDownload(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};

/* ========================================================================
   2. UI COMPONENT LIBRARY (Atomic Design)
   ======================================================================== */

// --- Icons ---
// Encapsulated to keep JSX clean. Using SVG paths directly.
const Icon = ({ path, className = "w-5 h-5", spin = false }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`${className} ${spin ? 'animate-spin' : ''}`}
    >
        <path d={path} />
    </svg>
);

const Icons = {
    Upload: (p) => <Icon {...p} path="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
    Download: (p) => <Icon {...p} path="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
    Layers: (p) => <Icon {...p} path="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
    Scissors: (p) => <Icon {...p} path="M6 9l6 6 6-6" />, // Simplified scissor rep
    Trash: (p) => <Icon {...p} path="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
    Plus: (p) => <Icon {...p} path="M12 5v14M5 12h14" />,
    ChevronUp: (p) => <Icon {...p} path="M18 15l-6-6-6 6" />,
    ChevronDown: (p) => <Icon {...p} path="M6 9l6 6 6-6" />,
    Loader: (p) => <Icon {...p} spin path="M21 12a9 9 0 1 1-6.219-8.56" />,
    Check: (p) => <Icon {...p} path="M20 6L9 17l-5-5" />,
    X: (p) => <Icon {...p} path="M18 6L6 18M6 6l12 12" />
};

// --- Atoms ---

const Button = ({ children, variant = 'primary', size = 'md', isLoading, disabled, className = '', ...props }) => {
    const baseClass = "font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]";
    
    const variants = {
        primary: "bg-primary-600 text-white shadow-lg shadow-primary-200 hover:bg-primary-700 disabled:bg-slate-300 disabled:shadow-none",
        secondary: "bg-white text-slate-700 border border-slate-200 hover:border-primary-500 hover:text-primary-600 disabled:bg-slate-50",
        ghost: "text-slate-400 hover:text-primary-600 hover:bg-primary-50",
        danger: "text-red-400 hover:text-red-600 hover:bg-red-50"
    };
    
    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-5 py-2.5 text-sm",
        lg: "px-6 py-3.5 text-base"
    };

    return (
        <button 
            className={`${baseClass} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? <Icons.Loader className="w-4 h-4" /> : children}
        </button>
    );
};

const Card = ({ children, className = '' }) => (
    <div className={`bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden ${className}`}>
        {children}
    </div>
);

const Badge = ({ children, type = 'neutral' }) => {
    const styles = {
        neutral: "bg-slate-100 text-slate-500",
        success: "bg-green-100 text-green-700",
        error: "bg-red-100 text-red-700",
        loading: "bg-primary-100 text-primary-700"
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${styles[type]}`}>
            {children}
        </span>
    );
};

/* ========================================================================
   3. FEATURE LAYER (Complex Logic Components)
   ======================================================================== */

/**
 * MergeFeature: Handles combining multiple PDFs into one.
 */
const MergeFeature = ({ isReady }) => {
    const [files, setFiles] = useState([]);
    const [status, setStatus] = useState('idle');
    const fileInputRef = useRef(null);

    const handleUpload = async (e) => {
        const newFiles = Array.from(e.target.files);
        if (newFiles.length === 0) return;

        setStatus('processing');
        try {
            const processed = await Promise.all(newFiles.map(PDFEngine.loadFile));
            setFiles(prev => [...prev, ...processed]);
            setStatus('idle');
        } catch (err) {
            alert(err.message);
            setStatus('error');
        }
        e.target.value = '';
    };

    const handleMerge = async () => {
        if (files.length === 0) return;
        setStatus('processing');

        try {
            const mergedPdf = await window.PDFLib.PDFDocument.create();
            
            for (const fileData of files) {
                const srcDoc = await window.PDFLib.PDFDocument.load(fileData.buffer, { ignoreEncryption: true });
                const indices = PDFEngine.parsePageIndices(fileData.range, fileData.pageCount);
                
                if (indices.length > 0) {
                    const copiedPages = await mergedPdf.copyPages(srcDoc, indices);
                    copiedPages.forEach(p => mergedPdf.addPage(p));
                }
            }
            
            const pdfBytes = await mergedPdf.save();
            PDFEngine.triggerDownload(new Blob([pdfBytes], { type: 'application/pdf' }), 'merged_document.pdf');
            setStatus('idle');
        } catch (error) {
            console.error(error);
            alert("An error occurred during the merge process.");
            setStatus('error');
        }
    };

    const reorderFile = (index, direction) => {
        const newFiles = [...files];
        if (direction === -1 && index > 0) {
            [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
        } else if (direction === 1 && index < newFiles.length - 1) {
            [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
        }
        setFiles(newFiles);
    };

    return (
        <div className="p-6 md:p-10 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Merge Workspace</h2>
                    <p className="text-slate-500">Drag to reorder. Edit page ranges (e.g., "1-3, 5").</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Button 
                            variant="secondary" 
                            disabled={!isReady || status === 'processing'}
                            onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        >
                            <Icons.Plus className="w-4 h-4" /> Add Files
                        </Button>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            multiple 
                            accept=".pdf" 
                            className="hidden" 
                            onChange={handleUpload} 
                            disabled={!isReady || status === 'processing'} 
                        />
                    </div>
                    {files.length > 0 && (
                        <Button variant="primary" onClick={handleMerge} isLoading={status === 'processing'}>
                            <Icons.Layers className="w-4 h-4" /> Merge PDF
                        </Button>
                    )}
                </div>
            </div>

            {files.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                        <Icons.Upload className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No files selected</h3>
                    <p className="text-slate-500">Upload PDF documents to begin</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {files.map((file, idx) => (
                        <div key={file.id} className="group bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 transition-all hover:border-primary-200 hover:shadow-md">
                            <div className="flex flex-col gap-1">
                                <button onClick={() => reorderFile(idx, -1)} disabled={idx === 0} className="text-slate-300 hover:text-primary-600 disabled:opacity-0 transition-opacity"><Icons.ChevronUp className="w-4 h-4" /></button>
                                <span className="text-xs font-mono font-bold text-slate-400 text-center">{idx + 1}</span>
                                <button onClick={() => reorderFile(idx, 1)} disabled={idx === files.length - 1} className="text-slate-300 hover:text-primary-600 disabled:opacity-0 transition-opacity"><Icons.ChevronDown className="w-4 h-4" /></button>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-700 truncate">{file.name}</h4>
                                <div className="text-xs text-slate-500 flex gap-2">
                                    <span>{file.pageCount} Pages</span>
                                    <span>•</span>
                                    <span>{file.size}</span>
                                </div>
                            </div>

                            <div className="w-full md:w-48">
                                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">Page Range</label>
                                <input 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                                    value={file.range}
                                    onChange={(e) => {
                                        const updated = [...files];
                                        updated[idx].range = e.target.value;
                                        setFiles(updated);
                                    }}
                                />
                            </div>

                            <Button variant="danger" size="sm" onClick={() => setFiles(files.filter(f => f.id !== file.id))}>
                                <Icons.Trash className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * SplitFeature: Handles bursting or extracting ranges from a single PDF.
 */
const SplitFeature = ({ isReady }) => {
    const [activeFile, setActiveFile] = useState(null);
    const [ranges, setRanges] = useState([{ id: 1, val: '' }]);
    const [status, setStatus] = useState('idle');

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setStatus('processing');
        try {
            const processed = await PDFEngine.loadFile(file);
            setActiveFile(processed);
            setRanges([{ id: 1, val: `1-${processed.pageCount}` }]);
            setStatus('idle');
        } catch (err) {
            alert(err.message);
            setStatus('error');
        }
        e.target.value = '';
    };

    const handleSplit = async (mode) => {
        if (!activeFile) return;
        setStatus('processing');

        try {
            const srcDoc = await window.PDFLib.PDFDocument.load(activeFile.buffer, { ignoreEncryption: true });
            const zip = new window.JSZip();
            const baseName = activeFile.name.replace(/\.pdf$/i, '');

            if (mode === 'burst') {
                for (let i = 0; i < activeFile.pageCount; i++) {
                    const newDoc = await window.PDFLib.PDFDocument.create();
                    const [copied] = await newDoc.copyPages(srcDoc, [i]);
                    newDoc.addPage(copied);
                    const pdfBytes = await newDoc.save();
                    zip.file(`${baseName}_page_${i + 1}.pdf`, pdfBytes);
                }
            } else {
                for (const range of ranges) {
                    const indices = PDFEngine.parsePageIndices(range.val, activeFile.pageCount);
                    if (indices.length > 0) {
                        const newDoc = await window.PDFLib.PDFDocument.create();
                        const copied = await newDoc.copyPages(srcDoc, indices);
                        copied.forEach(p => newDoc.addPage(p));
                        const pdfBytes = await newDoc.save();
                        zip.file(`${baseName}_split_${range.id}.pdf`, pdfBytes);
                    }
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            PDFEngine.triggerDownload(content, `${baseName}_split.zip`, 'application/zip');
            setStatus('idle');
        } catch (error) {
            console.error(error);
            alert("Split failed.");
            setStatus('error');
        }
    };

    return (
        <div className="p-6 md:p-10 animate-fade-in">
            {!activeFile ? (
                <label className={`block text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 cursor-pointer hover:bg-slate-100 hover:border-primary-400 transition-all group ${!isReady && 'opacity-50'}`}>
                    <div className="p-4 bg-white rounded-full inline-block mb-4 shadow-sm group-hover:scale-110 transition-transform text-primary-600">
                        <Icons.Upload className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">Upload PDF to Split</h3>
                    <p className="text-slate-500 mt-2">Extract specific pages or burst entire document</p>
                    <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={!isReady} />
                </label>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-6">
                        <Card className="p-5 bg-slate-50 border-slate-200">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-white rounded-lg shadow-sm text-primary-600">
                                    <Icons.Layers className="w-6 h-6" />
                                </div>
                                <div className="overflow-hidden">
                                    <div className="font-bold text-slate-800 truncate">{activeFile.name}</div>
                                    <div className="text-xs text-slate-500 font-medium">{activeFile.pageCount} Pages • {activeFile.size}</div>
                                </div>
                            </div>
                            <Button variant="danger" size="sm" className="w-full" onClick={() => setActiveFile(null)}>
                                Close File
                            </Button>
                        </Card>

                        <div className="space-y-3">
                            <Button variant="secondary" className="w-full justify-between group" onClick={() => handleSplit('burst')} isLoading={status === 'processing'}>
                                <span className="flex items-center gap-2"><Icons.Layers className="w-4 h-4 text-slate-400 group-hover:text-primary-500" /> Burst All Pages</span>
                                <span className="text-xs text-slate-400">ZIP</span>
                            </Button>
                            <Button variant="primary" className="w-full justify-between" onClick={() => handleSplit('custom')} isLoading={status === 'processing'}>
                                <span className="flex items-center gap-2"><Icons.Download className="w-4 h-4" /> Download Ranges</span>
                                <span className="text-xs text-primary-200">ZIP</span>
                            </Button>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <Card className="h-full bg-slate-50 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-slate-800">Custom Ranges</h3>
                                    <p className="text-xs text-slate-500">Define separate PDF files to generate.</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setRanges([...ranges, { id: Date.now(), val: '' }])}>
                                    <Icons.Plus className="w-4 h-4" /> Add Range
                                </Button>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {ranges.map((r, i) => (
                                    <div key={r.id} className="flex items-center gap-3">
                                        <div className="bg-white border border-slate-200 rounded-lg flex-1 flex items-center px-3 focus-within:ring-2 ring-primary-500 ring-offset-1 transition-all">
                                            <span className="text-xs font-bold text-slate-400 w-16 uppercase tracking-wide">Range {i + 1}</span>
                                            <div className="w-px h-6 bg-slate-100 mx-3"></div>
                                            <input 
                                                className="flex-1 py-3 bg-transparent text-sm font-medium outline-none text-slate-700 placeholder:text-slate-300"
                                                placeholder="e.g. 1-5" 
                                                value={r.val} 
                                                onChange={e => {
                                                    const n = [...ranges]; n[i].val = e.target.value; setRanges(n);
                                                }} 
                                            />
                                        </div>
                                        <Button variant="ghost" onClick={() => ranges.length > 1 && setRanges(ranges.filter(x => x.id !== r.id))} disabled={ranges.length === 1}>
                                            <Icons.X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ========================================================================
   4. APP SHELL (Layout & Routing)
   ======================================================================== */

const App = () => {
    const [activeTab, setActiveTab] = useState('merge');
    const [engineStatus, setEngineStatus] = useState('loading');

    useEffect(() => {
        const checkDependencies = () => {
            if (window.PDFLib && window.JSZip) {
                setEngineStatus('ready');
            } else {
                requestAnimationFrame(checkDependencies);
            }
        };
        checkDependencies();
    }, []);

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-12 grid grid-cols-1 lg:grid-cols-[260px_1fr_260px] gap-8 items-start">
                
                {/* Left Ad Column */}
                <aside className="hidden lg:flex flex-col gap-4 sticky top-8 h-fit min-h-[600px] bg-white rounded-2xl border border-dashed border-slate-200 items-center justify-center text-slate-400 text-sm font-medium">
                    Google Ad (160x600)
                </aside>

                {/* Main Content Column */}
                <div className="flex flex-col min-w-0 w-full">
                    
                    {/* Brand Header */}
                    <header className="text-center mb-10">
                        <div className="inline-flex p-4 bg-primary-600 rounded-2xl shadow-xl shadow-primary-200 mb-6 transform hover:scale-105 transition-transform duration-300">
                            <Icons.Layers className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                            PDF Master Tool
                        </h1>
                        <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
                            The professional's choice for secure document manipulation. 
                            <span className="block text-primary-600 font-medium">Free. Private. Serverless.</span>
                        </p>
                    </header>

                    {/* Feature Navigation */}
                    <nav className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 flex w-full max-w-sm mx-auto mb-8">
                        {['merge', 'split'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize flex items-center justify-center gap-2 transition-all duration-300 ${
                                    activeTab === tab 
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 scale-100' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                {tab === 'merge' ? <Icons.Layers className="w-4 h-4" /> : <Icons.Scissors className="w-4 h-4" />}
                                {tab}
                            </button>
                        ))}
                    </nav>

                    {/* App Container */}
                    <Card className="min-h-[500px] mb-16 relative">
                        {activeTab === 'merge' ? 
                            <MergeFeature isReady={engineStatus === 'ready'} /> : 
                            <SplitFeature isReady={engineStatus === 'ready'} />
                        }
                    </Card>

                    {/* Footer / Status Bar */}
                    <footer className="text-center pb-8 flex flex-col items-center gap-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm">
                            <Badge type={engineStatus === 'ready' ? 'success' : 'loading'}>
                                {engineStatus === 'ready' ? 'SYSTEM ONLINE' : 'INITIALIZING'}
                            </Badge>
                            <span className="text-xs text-slate-400 font-medium ml-2">v2.0.0 Stable</span>
                        </div>
                        
                        <div className="text-xs text-slate-400">
                            &copy; {new Date().getFullYear()} PDF Master. Engineered for privacy.
                            <span className="mx-2">•</span>
                            <a href="legal.html" className="hover:text-primary-600 underline transition-colors">Privacy & Terms</a>
                        </div>
                    </footer>

                </div>

                {/* Right Ad Column */}
                <aside className="hidden lg:flex flex-col gap-4 sticky top-8 h-fit min-h-[600px] bg-white rounded-2xl border border-dashed border-slate-200 items-center justify-center text-slate-400 text-sm font-medium">
                    Google Ad (160x600)
                </aside>

            </main>
        </div>
    );
};

// Mount Application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
