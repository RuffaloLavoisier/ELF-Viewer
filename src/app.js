import { state } from './state.js';
import { parseELFAsync } from './core/elfParser.js';
import { elements, modeButtons } from './ui/elements.js';
import { showLoading, updateProgress, hideLoading } from './ui/loading.js';
import { renderAll } from './ui/renderers.js';
import { setSearchMode, performSearch, previousMatch, nextMatch } from './ui/search.js';
import { initTabs } from './ui/tabs.js';
import { initLanguageToggle } from './ui/language.js';
import { sleep } from './utils/async.js';
import { formatBytes } from './utils/format.js';

function setupFileHandlers() {
    elements.fileInput.addEventListener('change', e => {
        if (e.target.files[0]) handleFile(e.target.files[0]);
    });
    elements.uploadButton.addEventListener('click', () => elements.fileInput.click());
    elements.uploadSection.addEventListener('dragover', e => {
        e.preventDefault();
        elements.uploadSection.classList.add('dragover');
    });
    elements.uploadSection.addEventListener('dragleave', () => elements.uploadSection.classList.remove('dragover'));
    elements.uploadSection.addEventListener('drop', e => {
        e.preventDefault();
        elements.uploadSection.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
}

function setupSearchHandlers() {
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => setSearchMode(btn.dataset.mode));
    });
    elements.searchBtn.addEventListener('click', performSearch);
    elements.searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') performSearch();
    });
    elements.prevBtn.addEventListener('click', previousMatch);
    elements.nextBtn.addEventListener('click', nextMatch);
    setSearchMode(state.searchMode);
}

async function handleFile(file) {
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatBytes(file.size);
    showLoading('Reading File...', 'Loading binary data into memory', 10);
    const reader = new FileReader();
    reader.onload = async function (e) {
        updateProgress(20, 'File loaded, validating ELF format...');
        await sleep(100);
        state.elfData = new Uint8Array(e.target.result);
        try {
            updateProgress(30, 'Parsing ELF header...');
            await sleep(100);
            state.parsedElf = await parseELFAsync(state.elfData, updateProgress);
            updateProgress(90, 'Rendering interface...');
            await sleep(100);
            renderAll();
            updateProgress(100, 'Complete!');
            await sleep(200);
            hideLoading();
            elements.results.style.display = 'block';
            elements.searchBar.style.display = 'block';
            state.searchMatches = [];
            state.currentMatchIndex = -1;
            elements.prevBtn.disabled = true;
            elements.nextBtn.disabled = true;
            elements.searchResults.textContent = '';
        } catch (err) {
            hideLoading();
            alert('Error: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function init() {
    setupFileHandlers();
    setupSearchHandlers();
    initTabs();
    initLanguageToggle();
}

init();
