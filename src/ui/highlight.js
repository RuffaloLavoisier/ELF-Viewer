import { elements } from './elements.js';

export function clearSelectionHighlights() {
    document.querySelectorAll('.hex-byte.selected,.ascii-char.selected,.field.highlighted')
        .forEach(e => e.classList.remove('selected', 'highlighted'));
}

export function highlightBytes(offset, size) {
    if (!elements.hexViewer) return;
    clearSelectionHighlights();
    for (let i = 0; i < size; i++) {
        const bo = offset + i;
        const hb = document.querySelector('.hex-byte[data-offset="' + bo + '"]');
        const ac = document.querySelector('.ascii-char[data-offset="' + bo + '"]');
        if (hb) hb.classList.add('selected');
        if (ac) ac.classList.add('selected');
    }
    const fb = document.querySelector('.hex-byte[data-offset="' + offset + '"]');
    if (fb) {
        const line = fb.closest('.hex-line');
        if (line) line.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (size > 0) {
        elements.selectedOffset.textContent = '0x' + offset.toString(16) + ' - 0x' + (offset + size - 1).toString(16) + ' (' + size + ' bytes)';
    } else {
        elements.selectedOffset.textContent = '0x' + offset.toString(16);
    }
}

export function setSelectedOffset(text) {
    elements.selectedOffset.textContent = text;
}
