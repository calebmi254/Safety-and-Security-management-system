/**
 * Landing Page Logic
 * 
 * Handles the 3-column overview:
 * 1. Earth Globe (Placeholder)
 * 2. Global News & Events (Tabbed + Infinite Scroll)
 * 3. Auth (Existing auth.js logic)
 */

let eventsOffset = 0;
let signalsOffset = 0;
const LIMIT = 10;
let loadingEvents = false;
let loadingSignals = false;
let allEventsLoaded = false;
let allSignalsLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
    initLandingTabs();
    initInfiniteScroll();

    // Initial load
    loadMoreEvents();
    loadMoreSignals();
});

function initLandingTabs() {
    const eventTabs = document.querySelectorAll('.intel-tab');
    eventTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            eventTabs.forEach(t => t.classList.remove('active'));
            // Add to clicked
            tab.classList.add('active');

            // Toggle view
            const target = tab.dataset.target;
            document.querySelectorAll('.intel-panel').forEach(panel => {
                panel.classList.add('d-none');
            });
            document.getElementById(target).classList.remove('d-none');
        });
    });
}

function initInfiniteScroll() {
    const options = {
        root: null, // Use viewport
        rootMargin: '100px', // Trigger slightly before reaching the bottom
        threshold: 0.1
    };

    const eventsObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !loadingEvents && !allEventsLoaded) {
            loadMoreEvents();
        }
    }, options);

    const signalsObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !loadingSignals && !allSignalsLoaded) {
            loadMoreSignals();
        }
    }, options);

    // Create sentinel elements
    const eventsSentinel = document.createElement('div');
    eventsSentinel.id = 'events-sentinel';
    eventsSentinel.className = 'p-3 text-center';
    eventsSentinel.innerHTML = '<div class="spinner-border spinner-border-sm text-primary d-none"></div>';
    document.getElementById('events-list').after(eventsSentinel);
    eventsObserver.observe(eventsSentinel);

    const signalsSentinel = document.createElement('div');
    signalsSentinel.id = 'signals-sentinel';
    signalsSentinel.className = 'p-3 text-center';
    signalsSentinel.innerHTML = '<div class="spinner-border spinner-border-sm text-primary d-none"></div>';
    document.getElementById('signals-list').after(signalsSentinel);
    signalsObserver.observe(signalsSentinel);
}

async function loadMoreEvents() {
    if (loadingEvents || allEventsLoaded) return;
    loadingEvents = true;

    const list = document.getElementById('events-list');
    const sentinel = document.getElementById('events-sentinel');
    if (sentinel) sentinel.querySelector('.spinner-border').classList.remove('d-none');

    try {
        const res = await api.public.getEvents({ limit: LIMIT, offset: eventsOffset });

        // Remove initial loading spinner if it exists
        if (eventsOffset === 0 && list.querySelector('.spinner-border')) {
            list.innerHTML = '';
        }

        if (res.data && res.data.length > 0) {
            const html = res.data.map(renderEventItem).join('');
            list.insertAdjacentHTML('beforeend', html);
            eventsOffset += res.data.length;

            if (res.data.length < LIMIT) {
                allEventsLoaded = true;
                if (sentinel) sentinel.innerHTML = '<span class="x-small opacity-25">End of verified intelligence feed.</span>';
            }
        } else if (eventsOffset === 0) {
            list.innerHTML = '<div class="p-4 text-center text-secondary">No automated events logged yet.</div>';
            allEventsLoaded = true;
        } else {
            allEventsLoaded = true;
            if (sentinel) sentinel.innerHTML = '<span class="x-small opacity-25">End of verified intelligence feed.</span>';
        }
    } catch (err) {
        console.error('Failed to load events:', err);
    } finally {
        loadingEvents = false;
        if (sentinel && !allEventsLoaded) sentinel.querySelector('.spinner-border').classList.add('d-none');
    }
}

async function loadMoreSignals() {
    if (loadingSignals || allSignalsLoaded) return;
    loadingSignals = true;

    const list = document.getElementById('signals-list');
    const sentinel = document.getElementById('signals-sentinel');
    if (sentinel) sentinel.querySelector('.spinner-border').classList.remove('d-none');

    try {
        const res = await api.public.getSignals({ limit: LIMIT, offset: signalsOffset });

        // Remove initial loading spinner if it exists
        if (signalsOffset === 0 && list.querySelector('.spinner-border')) {
            list.innerHTML = '';
        }

        if (res.data && res.data.length > 0) {
            const html = res.data.map(renderSignalItem).join('');
            list.insertAdjacentHTML('beforeend', html);
            signalsOffset += res.data.length;

            if (res.data.length < LIMIT) {
                allSignalsLoaded = true;
                if (sentinel) sentinel.innerHTML = '<span class="x-small opacity-25">End of media signals feed.</span>';
            }
        } else if (signalsOffset === 0) {
            list.innerHTML = '<div class="p-4 text-center text-secondary">No fresh signals detected.</div>';
            allSignalsLoaded = true;
        } else {
            allSignalsLoaded = true;
            if (sentinel) sentinel.innerHTML = '<span class="x-small opacity-25">End of media signals feed.</span>';
        }
    } catch (err) {
        console.error('Failed to load signals:', err);
    } finally {
        loadingSignals = false;
        if (sentinel && !allSignalsLoaded) sentinel.querySelector('.spinner-border').classList.add('d-none');
    }
}

function renderSignalItem(signal) {
    const date = new Date(signal.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
        <div class="news-item border-bottom border-secondary border-opacity-10 p-3 virtual-item">
            <div class="d-flex justify-content-between align-items-start mb-1">
                <span class="badge bg-secondary-subtle text-secondary x-small">${signal.source}</span>
                <span class="x-small opacity-50 text-uppercase">${date}</span>
            </div>
            <h6 class="mb-1 small fw-bold">${signal.title}</h6>
            <div class="d-flex justify-content-between align-items-center">
                <span class="x-small text-primary">${signal.country || 'Global'}</span>
                <a href="${signal.url}" target="_blank" class="x-small text-decoration-none">Source <i class="bi bi-box-arrow-up-right"></i></a>
            </div>
        </div>
    `;
}

function renderEventItem(event) {
    const date = new Date(event.occurred_at).toLocaleDateString();
    const severityClass = event.severity >= 4 ? 'bg-danger' : (event.severity >= 3 ? 'bg-warning' : 'bg-primary');
    const sourceLink = event.source_url ? `<a href="${event.source_url}" target="_blank" class="x-small text-decoration-none">Source <i class="bi bi-box-arrow-up-right"></i></a>` : '';

    // Intensity Badge
    const intensityBadge = event.intensity ? `<span class="badge bg-dark text-secondary x-small border border-secondary border-opacity-25 ms-1">INTENSITY ${event.intensity}</span>` : '';

    // We ONLY display if there is a real title (filtered by API, but safety first)
    if (!event.title) return '';

    return `
        <div class="news-item border-bottom border-secondary border-opacity-10 p-3 virtual-item">
            <div class="d-flex justify-content-between align-items-start mb-1">
                <div class="d-flex align-items-center">
                    <span class="badge ${severityClass} x-small text-uppercase">${event.event_category.replace('_', ' ')}</span>
                    ${intensityBadge}
                </div>
                <span class="x-small opacity-50">${date}</span>
            </div>
            <h6 class="mb-1 small fw-bold text-light">${event.title}</h6>
            <p class="mb-2 x-small opacity-50 italic">${event.description}</p>
            <div class="d-flex justify-content-between align-items-center">
                <span class="x-small text-primary">${event.country || 'Global'}</span>
                <div class="d-flex gap-2 align-items-center">
                    <span class="x-small opacity-50 italic">${event.source}</span>
                    ${sourceLink}
                </div>
            </div>
        </div>
    `;
}
