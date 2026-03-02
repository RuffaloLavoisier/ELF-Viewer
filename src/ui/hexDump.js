import { elements } from './elements.js';
import { highlightBytes } from './highlight.js';

export function renderHexDump(data) {
    const c = elements.hexViewer;
    c.innerHTML = '';
    const bpl = 16;
    const lines = Math.ceil(data.length / bpl);
    for (let i = 0; i < lines; i++) {
        const o = i * bpl;
        const ld = document.createElement('div');
        ld.className = 'hex-line';
        const os = document.createElement('span');
        os.className = 'hex-offset';
        os.textContent = '0x' + o.toString(16).padStart(8, '0');
        ld.appendChild(os);
        const bd = document.createElement('div');
        bd.className = 'hex-bytes';
        for (let j = 0; j < bpl; j++) {
            const bo = o + j;
            if (bo < data.length) {
                if (j % 8 === 0 && j > 0) {
                    const sp = document.createElement('span');
                    sp.textContent = ' ';
                    bd.appendChild(sp);
                }
                const bs = document.createElement('span');
                bs.className = 'hex-byte';
                bs.textContent = data[bo].toString(16).padStart(2, '0');
                bs.dataset.offset = bo;
                bs.addEventListener('click', (e) => { e.stopPropagation(); highlightBytes(bo, 1); });
                bd.appendChild(bs);
            }
        }
        ld.appendChild(bd);
        const ad = document.createElement('div');
        ad.className = 'hex-ascii';
        for (let j = 0; j < bpl; j++) {
            const bo = o + j;
            if (bo < data.length) {
                const b = data[bo];
                const ch = (b >= 32 && b < 127) ? String.fromCharCode(b) : '.';
                const cs = document.createElement('span');
                cs.className = 'ascii-char';
                cs.textContent = ch;
                cs.dataset.offset = bo;
                cs.addEventListener('click', (e) => { e.stopPropagation(); highlightBytes(bo, 1); });
                ad.appendChild(cs);
            }
        }
        ld.appendChild(ad);
        c.appendChild(ld);
    }
}
