import { state } from '../state.js';
import { elements, modeButtons } from './elements.js';
import { highlightBytes, setSelectedOffset } from './highlight.js';

const PLACEHOLDERS = {
    hex: 'Search hex bytes (e.g., 7F 45 4C 46 or 7F454C46)',
    string: 'Search for text string',
    offset: 'Jump to offset (e.g., 0x1000 or 4096)'
};

export function setSearchMode(mode) {
    state.searchMode = mode;
    modeButtons.forEach(b => b.classList.remove('active'));
    const active = modeButtons.find(b => b.dataset.mode === mode);
    if (active) active.classList.add('active');
    elements.searchInput.placeholder = PLACEHOLDERS[mode] || PLACEHOLDERS.hex;
}

export function performSearch() {
    if (!state.elfData) return;
    const q = elements.searchInput.value.trim();
    if (!q) return;
    clearSearchHighlights();
    state.searchMatches = [];

    if (state.searchMode === 'offset') {
        const o = q.startsWith('0x') ? parseInt(q, 16) : parseInt(q, 10);
        if (!isNaN(o) && o >= 0 && o < state.elfData.length) {
            highlightBytes(o, 1);
            elements.searchResults.textContent = 'Jumped to offset 0x' + o.toString(16);
        } else {
            elements.searchResults.textContent = 'Invalid offset';
        }
        return;
    }

    if (state.searchMode === 'hex') {
        const hb = q.replace(/[^0-9a-fA-F]/g, '');
        if (hb.length % 2 !== 0) {
            elements.searchResults.textContent = 'Invalid hex (must be even length)';
            return;
        }
        const pattern = [];
        for (let i = 0; i < hb.length; i += 2) pattern.push(parseInt(hb.substr(i, 2), 16));
        for (let i = 0; i <= state.elfData.length - pattern.length; i++) {
            let match = true;
            for (let j = 0; j < pattern.length; j++) {
                if (state.elfData[i + j] !== pattern[j]) {
                    match = false;
                    break;
                }
            }
            if (match) state.searchMatches.push({ offset: i, size: pattern.length });
        }
    } else if (state.searchMode === 'string') {
        const bytes = [];
        for (let i = 0; i < q.length; i++) bytes.push(q.charCodeAt(i));
        for (let i = 0; i <= state.elfData.length - bytes.length; i++) {
            let match = true;
            for (let j = 0; j < bytes.length; j++) {
                if (state.elfData[i + j] !== bytes[j]) {
                    match = false;
                    break;
                }
            }
            if (match) state.searchMatches.push({ offset: i, size: bytes.length });
        }
    }

    if (state.searchMatches.length > 0) {
        state.currentMatchIndex = 0;
        highlightSearchMatches();
        navigateToMatch(0);
        elements.searchResults.textContent = 'Found ' + state.searchMatches.length + ' match' + (state.searchMatches.length > 1 ? 'es' : '') + ' (highlighting max 100)';
        elements.prevBtn.disabled = false;
        elements.nextBtn.disabled = false;
    } else {
        elements.searchResults.textContent = 'No matches found';
        elements.prevBtn.disabled = true;
        elements.nextBtn.disabled = true;
    }
}

export function previousMatch() {
    if (state.currentMatchIndex > 0) {
        clearSearchHighlights();
        state.currentMatchIndex--;
        highlightSearchMatches();
        navigateToMatch(state.currentMatchIndex);
    }
}

export function nextMatch() {
    if (state.currentMatchIndex < state.searchMatches.length - 1) {
        clearSearchHighlights();
        state.currentMatchIndex++;
        highlightSearchMatches();
        navigateToMatch(state.currentMatchIndex);
    }
}

function clearSearchHighlights() {
    document.querySelectorAll('.hex-byte.search-match,.hex-byte.search-current,.ascii-char.search-match,.ascii-char.search-current')
        .forEach(e => e.classList.remove('search-match', 'search-current'));
}

function highlightSearchMatches() {
    const maxHighlight = 100;
    state.searchMatches.slice(0, maxHighlight).forEach((m, i) => {
        for (let j = 0; j < m.size; j++) {
            const o = m.offset + j;
            const hb = document.querySelector('.hex-byte[data-offset="' + o + '"]');
            const ac = document.querySelector('.ascii-char[data-offset="' + o + '"]');
            if (hb) hb.classList.add(i === state.currentMatchIndex ? 'search-current' : 'search-match');
            if (ac) ac.classList.add(i === state.currentMatchIndex ? 'search-current' : 'search-match');
        }
    });
}

function navigateToMatch(index) {
    if (index < 0 || index >= state.searchMatches.length) return;
    const m = state.searchMatches[index];
    const fb = document.querySelector('.hex-byte[data-offset="' + m.offset + '"]');
    if (fb) {
        const line = fb.closest('.hex-line');
        if (line) line.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setSelectedOffset('Match ' + (index + 1) + '/' + state.searchMatches.length + ': 0x' + m.offset.toString(16));
}
