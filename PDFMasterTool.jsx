/**
 * PDF Master Tool - Fixed Version
 * Flattens component structure to prevent runtime reference errors.
 */

// 1. Explicitly assign React hooks to variables to avoid Babel destructuring issues
const useState = React.useState;
const useEffect = React.useEffect;
const useCallback = React.useCallback;

// 2. Base Icon Component
const BaseIcon = ({ d, className = "w-5 h-5", spin = false }) => (
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
        <path d={d} />
    </svg>
);

// 3. Individual Icon Components (Flattens the object to prevent "undefined" errors)
const IconUpload = () => <BaseIcon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />;
const IconDownload = () => <BaseIcon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />;
const IconLayers = (props) => <BaseIcon {...props} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />;
const IconScissors = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>;
const IconTrash = () => <BaseIcon d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />;
const IconPlus = () => <BaseIcon d="M12 5v14M5 12h14" />;
const IconUp = () => <BaseIcon d="M18 15l-6-6-6 6" />;
const IconDown = () => <BaseIcon d="M6 9l6 6 6-6" />;
const IconLoader = () => <BaseIcon spin d="M21 12a9 9 0 1 1-6.219-8.56" />;
const IconClose = () => <BaseIcon d="M18 6L6 18M6 6l12 12" />;

// 4. PDF Logic Service
const PDFService = {
    async load(file) {
        const buffer = await file.arrayBuffer();
        const doc = await window.PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
        return {
            id: Math.random().toString(36).slice(2),
            file,
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            pageCount: doc.getPageCount(),
            buffer,
            range: `1-${doc.getPageCount()}`
        };
    },
    parseRange(str, max) {
        const s = new Set();
        str.split(',').forEach(p => {
            const c = p.trim();
            if (c.includes('-')) {
                let [a, b] = c.split('-').map(n => parseInt(n));
                if (isNaN(a)) a = 1; if (isNaN(b)) b = max;
                for (let i = Math.max(1, a); i <= Math.min(max, b); i++) s.add(i - 1);
            } else {
                const n = parseInt(c);
                if (!isNaN(n) && n >= 1 && n <= max) s.add(n - 1);
            }
        });
        return Array.from(s).sort((a, b) => a - b);
    },
    download(blob, name) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
};

// 5. UI Components
const Button = ({ children
