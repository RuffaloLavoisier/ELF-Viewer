import { tabButtons } from './elements.js';

export function initTabs() {
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab, btn));
    });
}

export function switchTab(tabId, button) {
    tabButtons.forEach(t => t.classList.remove('active'));
    if (button) button.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
}
