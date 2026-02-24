/**
 * SecureX - Global Utilities
 */

const Utils = {
    /**
     * Show a premium toast notification
     * @param {string} message 
     * @param {string} type - 'success', 'danger', 'info', 'warning'
     */
    showToast: (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toastId = 'toast-' + Date.now();
        const icon = type === 'success' ? 'bi-check-circle-fill' :
            type === 'danger' ? 'bi-x-circle-fill' :
                type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill';

        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0 glass-toast mb-2" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body d-flex align-items-center gap-2">
                        <i class="bi ${icon} fs-5"></i>
                        <span class="fw-bold">${message}</span>
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', toastHtml);
        const toastEl = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
        toast.show();

        // Cleanup DOM after hidden
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    },

    /**
     * Render an elegant error view for containers (usually lists/tables)
     * @param {string} elementId - Target element ID
     * @param {string} message - Primary error message
     * @param {string} subtitle - Secondary description (e.g. Forbidden details)
     */
    renderErrorView: (elementId, message, subtitle = '') => {
        const target = document.getElementById(elementId);
        if (!target) return;

        const isForbidden = message.toLowerCase().includes('forbidden') || subtitle.toLowerCase().includes('forbidden');

        if (isForbidden) {
            target.innerHTML = `
                <tr>
                    <td colspan="100%" class="border-0">
                        <div class="d-flex flex-column align-items-center justify-content-center py-5 w-100 text-center">
                            <div class="error-icon-wrapper mb-3 text-warning">
                                <i class="bi bi-shield-lock-fill display-2 opacity-50"></i>
                            </div>
                            <h3 class="h5 fw-bold mb-0 text-white opacity-75">Access Restricted</h3>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            target.innerHTML = `
                <tr>
                    <td colspan="100%" class="border-0">
                        <div class="d-flex flex-column align-items-center justify-content-center py-5 w-100 text-center text-danger">
                            <i class="bi bi-exclamation-octagon display-4 mb-3 opacity-50"></i>
                            <p class="small fw-bold mb-0">${message}</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
};

window.showToast = Utils.showToast;
window.renderErrorView = Utils.renderErrorView;
