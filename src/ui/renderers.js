import { state } from '../state.js';
import { elements } from './elements.js';
import { highlightBytes } from './highlight.js';
import { renderHexDump } from './hexDump.js';
import { escapeHtml, formatBytes } from '../utils/format.js';
import { getMachine, getSegmentType, getSymbolBind, getSymbolType } from '../domain/elf-constants.js';

function createFieldElement(field) {
    const fd = document.createElement('div');
    fd.className = 'field';
    fd.innerHTML = '<div class="field-name">' + field.name + '</div>' +
        '<div class="field-value">' + field.value + '</div>' +
        '<div class="field-offset">@0x' + field.offset.toString(16) + ' (' + field.size + 'B)</div>';
    fd.addEventListener('click', () => {
        highlightBytes(field.offset, field.size);
        fd.classList.add('highlighted');
    });
    return fd;
}

export function renderAll() {
    const parsed = state.parsedElf;
    if (!parsed || !state.elfData) return;
    elements.fileArch.textContent = getMachine(parsed.header.machine) + ' (' + (parsed.is64 ? '64-bit' : '32-bit') + ')';
    renderElfHeader();
    renderProgramHeaders();
    renderSectionHeaders();
    renderSymbols();
    renderStrings();
    renderStatistics();
    renderWarnings();
    renderHexDump(state.elfData);
}

export function renderElfHeader() {
    const parsed = state.parsedElf;
    const c = elements.elfHeader;
    c.innerHTML = '';
    const s = document.createElement('div');
    s.className = 'section';
    s.innerHTML = '<h3>ELF Header <span class="badge success">' + (parsed.is64 ? 'ELF64' : 'ELF32') + '</span></h3>';
    parsed.header.fields.forEach(f => s.appendChild(createFieldElement(f)));
    c.appendChild(s);
}

export function renderProgramHeaders() {
    const parsed = state.parsedElf;
    const c = elements.programHeaders;
    c.innerHTML = '';
    parsed.programHeaders.forEach((ph, i) => {
        const s = document.createElement('div');
        s.className = 'section';
        const bc = ph.type === 1 ? 'success' : 'warning';
        s.innerHTML = '<h3>Program Header #' + i + ' <span class="badge ' + bc + '">' + getSegmentType(ph.type) + '</span></h3>';
        ph.fields.forEach(f => s.appendChild(createFieldElement(f)));
        if (ph.dataPreview) {
            const p = document.createElement('div');
            p.className = 'data-preview';
            p.innerHTML = '<strong>Data Preview:</strong><br>' + ph.dataPreview.map(b => b.toString(16).padStart(2, '0')).join(' ');
            s.appendChild(p);
        }
        c.appendChild(s);
    });
}

export function renderSectionHeaders() {
    const parsed = state.parsedElf;
    const c = elements.sectionHeaders;
    c.innerHTML = '';
    parsed.sectionHeaders.forEach((sh, i) => {
        const s = document.createElement('div');
        s.className = 'section';
        let bc = 'info';
        const name = sh.name || '';
        if (name.includes('.text')) bc = 'success';
        else if (name.includes('.data')) bc = 'warning';
        s.innerHTML = '<h3>Section #' + i + ' <span class="badge ' + bc + '">' + (sh.name || 'unnamed') + '</span></h3>';
        sh.fields.forEach(f => s.appendChild(createFieldElement(f)));
        if (sh.dataPreview) {
            const p = document.createElement('div');
            p.className = 'data-preview';
            p.innerHTML = '<strong>Data Preview:</strong><br>' + sh.dataPreview.map(b => b.toString(16).padStart(2, '0')).join(' ');
            s.appendChild(p);
        }
        c.appendChild(s);
    });
}

export function renderSymbols() {
    const parsed = state.parsedElf;
    const c = elements.symbols;
    c.innerHTML = '';
    if (parsed.symbolSections.length === 0) {
        c.innerHTML = '<div class="warning-box">⚠️ No symbol sections found (.symtab or .dynsym)<br>This binary may be <strong>stripped</strong>. Use "readelf -S" to verify sections.</div>';
        return;
    }
    if (parsed.symbols.length === 0) {
        c.innerHTML = '<div class="warning-box">⚠️ Symbol sections found (' + parsed.symbolSections.join(', ') + ') but no symbols parsed.<br>This may indicate a parsing issue.</div>';
        return;
    }
    const s = document.createElement('div');
    s.className = 'section';
    s.innerHTML = '<h3>Symbol Table <span class="badge success">' + parsed.symbols.length + ' symbols</span> <span class="badge info">' + parsed.symbolSections.join(', ') + '</span></h3>';
    const t = document.createElement('table');
    t.innerHTML = '<thead><tr><th>#</th><th>Name</th><th>Type</th><th>Bind</th><th>Value</th><th>Size</th><th>Shndx</th></tr></thead><tbody></tbody>';
    const tb = t.querySelector('tbody');
    parsed.symbols.slice(0, 1000).forEach(sym => {
        const r = document.createElement('tr');
        r.addEventListener('click', () => highlightBytes(sym.offset, parsed.is64 ? 24 : 16));
        r.innerHTML = '<td style="color:#8b949e">' + sym.index + '</td>' +
            '<td style="color:#79c0ff">' + escapeHtml(sym.name) + '</td>' +
            '<td>' + getSymbolType(sym.type) + '</td>' +
            '<td>' + getSymbolBind(sym.bind) + '</td>' +
            '<td>0x' + sym.value.toString(16) + '</td>' +
            '<td>' + sym.size + '</td>' +
            '<td>' + (sym.shndxDisplay || sym.shndx) + '</td>';
        tb.appendChild(r);
    });
    s.appendChild(t);
    if (parsed.symbols.length > 1000) {
        const n = document.createElement('p');
        n.style = 'color:#8b949e;padding:10px';
        n.textContent = 'Showing first 1000 of ' + parsed.symbols.length + ' symbols';
        s.appendChild(n);
    }
    c.appendChild(s);
}

export function renderStrings() {
    const parsed = state.parsedElf;
    const c = elements.strings;
    c.innerHTML = '';
    if (parsed.strings.length === 0) {
        c.innerHTML = '<div class="warning-box">⚠️ No string sections found<br>The binary may not contain standard string tables.</div>';
        return;
    }
    const s = document.createElement('div');
    s.className = 'section';
    s.innerHTML = '<h3>String Tables <span class="badge success">' + parsed.strings.length + ' strings</span></h3>';
    const t = document.createElement('table');
    t.innerHTML = '<thead><tr><th>String</th><th>Section</th><th>Offset</th><th>Length</th></tr></thead><tbody></tbody>';
    const tb = t.querySelector('tbody');
    parsed.strings.slice(0, 1000).forEach(str => {
        const r = document.createElement('tr');
        r.addEventListener('click', () => highlightBytes(str.offset, str.size));
        const displayStr = str.value.length > 50 ? str.value.substring(0, 50) + '...' : str.value;
        r.innerHTML = '<td style="color:#7ee787">' + escapeHtml(displayStr) + '</td>' +
            '<td style="color:#8b949e">' + str.section + '</td>' +
            '<td>0x' + str.offset.toString(16) + '</td>' +
            '<td>' + str.value.length + '</td>';
        tb.appendChild(r);
    });
    s.appendChild(t);
    if (parsed.strings.length > 1000) {
        const n = document.createElement('p');
        n.style = 'color:#8b949e;padding:10px';
        n.textContent = 'Showing first 1000 of ' + parsed.strings.length + ' strings';
        s.appendChild(n);
    }
    c.appendChild(s);
}

export function renderStatistics() {
    const parsed = state.parsedElf;
    const c = elements.statistics;
    c.innerHTML = '';
    const s = document.createElement('div');
    s.className = 'section';
    s.innerHTML = '<h3>File Statistics</h3>';
    const g = document.createElement('div');
    g.className = 'stat-grid';
    const stats = [
        { label: 'Total File Size', value: formatBytes(state.elfData.length) },
        { label: 'Section Count', value: parsed.sectionHeaders.length },
        { label: 'Program Header Count', value: parsed.programHeaders.length },
        { label: 'Symbol Count', value: parsed.symbols.length },
        { label: 'String Count', value: parsed.strings.length },
        { label: 'Loadable Segments', value: parsed.programHeaders.filter(ph => ph.type === 1).length },
        { label: 'Symbol Sections', value: parsed.symbolSections.length > 0 ? parsed.symbolSections.join(', ') : 'None (stripped)' },
        { label: 'Warnings', value: parsed.warnings ? parsed.warnings.length : 0 }
    ];
    stats.forEach(st => {
        const cd = document.createElement('div');
        cd.className = 'stat-card';
        cd.innerHTML = '<h4>' + st.label + '</h4><div class="stat-value">' + st.value + '</div>';
        g.appendChild(cd);
    });
    s.appendChild(g);
    c.appendChild(s);
}

export function renderWarnings() {
    const parsed = state.parsedElf;
    const c = elements.warnings;
    c.innerHTML = '';
    const s = document.createElement('div');
    s.className = 'section';
    if (!parsed.warnings || parsed.warnings.length === 0) {
        s.innerHTML = '<h3>Warnings</h3><p style="color:#8b949e;padding:6px 0">No warnings.</p>';
        c.appendChild(s);
        return;
    }
    s.innerHTML = '<h3>Warnings <span class="badge warning">' + parsed.warnings.length + '</span></h3>';
    parsed.warnings.forEach(w => {
        const d = document.createElement('div');
        d.className = 'warning-box';
        d.textContent = w;
        s.appendChild(d);
    });
    c.appendChild(s);
}
