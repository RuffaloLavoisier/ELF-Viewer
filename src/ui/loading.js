import { elements } from './elements.js';

export function showLoading(text, subtext, percent) {
    elements.loadingOverlay.classList.add('active');
    elements.loadingText.textContent = text;
    elements.loadingSubtext.textContent = subtext;
    elements.progressBar.style.width = percent + '%';
    elements.progressPercent.textContent = percent + '%';
}

export function updateProgress(percent, step) {
    elements.progressBar.style.width = percent + '%';
    elements.progressPercent.textContent = percent + '%';
    elements.progressStep.textContent = step;
}

export function hideLoading() {
    elements.loadingOverlay.classList.remove('active');
}
