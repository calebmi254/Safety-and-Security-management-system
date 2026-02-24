/**
 * SecureX - Office Asset Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const contentContainer = document.getElementById('dashboard-content');
    const navHome = document.getElementById('nav-home');
    const navOffices = document.getElementById('nav-offices');

    // Auth State
    const user = JSON.parse(localStorage.getItem('sx_user') || '{}');
    const userRole = user.role || 'employee';

    // Form & Modal
    const officeForm = document.getElementById('office-form');
    const officeModal = new bootstrap.Modal(document.getElementById('officeModal'));
    const modalTitle = document.getElementById('officeModalLabel');

    let currentEditId = null;
    let homeBaselineHtml = contentContainer.innerHTML; // Save home view

    // --- Navigation ---

    navOffices.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navOffices);
        loadOfficesView();
    });

    navHome.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav(navHome);
        contentContainer.innerHTML = homeBaselineHtml;
    });

    function setActiveNav(el) {
        document.querySelectorAll('.nav-item, .submenu-item').forEach(item => item.classList.remove('active'));
        el.classList.add('active');
        // If it's a submenu item, also highlight the parent
        if (el.classList.contains('submenu-item')) {
            el.closest('div').previousElementSibling.classList.add('active');
        }
    }

    // --- View Rendering ---

    async function loadOfficesView() {
        contentContainer.innerHTML = `
            <div class="content-grid">
                <!-- Column 1: Office Registry -->
                <div class="grid-main">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2 class="h4 fw-bold">Global Office Registry</h2>
                        ${userRole === 'admin' ? `
                        <button class="btn btn-primary btn-sm" onclick="openOfficeModal()">
                            <i class="bi bi-plus-lg me-2"></i> Register Office
                        </button>` : ''}
                    </div>
                    
                    <div class="glass-card p-0 overflow-hidden">
                        <table class="table table-dark table-hover mb-0">
                            <thead>
                                <tr>
                                    <th class="ps-4 py-3 small fw-bold">OFFICE NAME</th>
                                    <th class="py-3 small fw-bold">LOCATION</th>
                                    <th class="py-3 small fw-bold">TYPE</th>
                                    <th class="py-3 small fw-bold">STATUS</th>
                                    <th class="pe-4 py-3 text-end small fw-bold">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody id="offices-table-body">
                                <tr>
                                    <td colspan="5" class="text-center py-5">
                                        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                                        Loading assets...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Vertical Separator -->
                <div class="vertical-separator"></div>

                <!-- Column 2: Analysis & News -->
                <div class="grid-side">
                    <div class="secondary-tabs h-100" id="office-details-pane">
                        <div class="tab-placeholder-content">
                            <i class="bi bi-building-check fs-1 mb-3"></i>
                            <p class="small">Select an office to view asset details and security analysis.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        renderOfficesList();
    }

    async function renderOfficesList() {
        const tbody = document.getElementById('offices-table-body');
        try {
            const result = await API.offices.getAll();
            const offices = result.data;

            if (offices.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 opacity-50">No offices registered yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = offices.map(office => `
                <tr id="row-${office.id}" class="align-middle clickable-row" onclick="viewOfficeDetails('${office.id}')">
                    <td class="ps-4">
                        <div class="fw-bold text-white">${office.office_name}</div>
                        <div class="x-small text-secondary">${office.office_code || 'No Code'}</div>
                    </td>
                    <td>
                        <div class="small">${office.city}, ${office.country}</div>
                        <div class="x-small text-secondary opacity-75">${office.physical_address || ''}</div>
                    </td>
                    <td>
                        <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">${office.office_type}</span>
                    </td>
                    <td>
                        <span class="small ${office.is_active ? 'text-success' : 'text-danger'}">
                            <i class="bi bi-circle-fill x-small me-2"></i>${office.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td class="pe-4 text-end">
                        ${userRole === 'admin' ? `
                        <button class="btn btn-link text-primary p-1" onclick="event.stopPropagation(); editOffice('${office.id}')" title="Edit">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        <button class="btn btn-link text-danger p-1" onclick="event.stopPropagation(); deleteOffice('${office.id}')" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>` : '<span class="x-small text-secondary opacity-50">Read Only</span>'}
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            const subtitle = error.message.includes('Forbidden') ?
                'Access denied. Office asset deployment is restricted to organizational administrators.' :
                error.message;
            renderErrorView('offices-table-body', error.message, subtitle);
        }
    }

    // --- Office Details Pane ---

    window.viewOfficeDetails = async (id) => {
        // Highlight Active Row
        document.querySelectorAll('.clickable-row').forEach(row => row.classList.remove('active-row'));
        const activeRow = document.getElementById(`row-${id}`);
        if (activeRow) activeRow.classList.add('active-row');

        const pane = document.getElementById('office-details-pane');
        pane.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;

        try {
            const result = await API.offices.getById(id);
            const office = result.data;

            pane.innerHTML = `
                <div class="d-flex align-items-center mb-4">
                    <div class="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3" style="width: 48px; height: 48px;">
                        <i class="bi bi-building text-primary fs-4"></i>
                    </div>
                    <div>
                        <h3 class="h5 fw-bold mb-0">${office.office_name}</h3>
                        <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">${office.office_type}</span>
                    </div>
                </div>

                <ul class="nav nav-pills nav-pills-custom mb-4" id="officeTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="details-tab" data-bs-toggle="pill" data-bs-target="#details-pane" type="button">Asset Details</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="analysis-tab" data-bs-toggle="pill" data-bs-target="#analysis-pane" type="button">Analysis</button>
                    </li>
                </ul>

                <div class="tab-content">
                    <div class="tab-pane fade show active" id="details-pane">
                        <div class="mb-3">
                            <label class="x-small text-uppercase fw-bold opacity-50 mb-1">Code</label>
                            <div class="small">${office.office_code || 'N/A'}</div>
                        </div>
                        <div class="mb-3">
                            <label class="x-small text-uppercase fw-bold opacity-50 mb-1">Location</label>
                            <div class="small">${office.city}, ${office.country}</div>
                            <div class="x-small text-secondary mt-1">${office.physical_address || ''}</div>
                        </div>
                        <div class="mb-3">
                            <label class="x-small text-uppercase fw-bold opacity-50 mb-1">Coordinates</label>
                            <div class="small opacity-50">${office.latitude ? `${office.latitude}, ${office.longitude}` : 'Manual Overide Required'}</div>
                        </div>
                        
                        ${userRole === 'admin' ? `
                        <div class="d-grid gap-2 mt-4">
                            <button class="btn btn-outline-primary btn-sm" onclick="editOffice('${office.id}')">
                                <i class="bi bi-pencil me-2"></i> Edit Properties
                            </button>
                        </div>` : ''}
                    </div>
                    <div class="tab-pane fade" id="analysis-pane">
                        <div class="tab-placeholder-content py-4">
                            <i class="bi bi-graph-up-arrow fs-2 mb-2"></i>
                            <p class="small">Real-time threat analysis for this sector is currently offline.</p>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            pane.innerHTML = `<div class="alert alert-danger small">${error.message}</div>`;
        }
    };

    // --- Form Handling ---

    window.openOfficeModal = (id = null) => {
        currentEditId = id;
        officeForm.reset();
        modalTitle.textContent = id ? 'Edit Office Asset' : 'Register New Office';

        if (id) {
            // Fetch data and populate
            API.offices.getById(id).then(res => {
                const data = res.data;
                Object.keys(data).forEach(key => {
                    const input = officeForm.elements[key];
                    if (input) input.value = data[key] || '';
                });
            });
        }

        officeModal.show();
    };

    officeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(officeForm);
        const data = Object.fromEntries(formData.entries());

        // Convert numeric fields and handle empty strings
        const numericFields = ['latitude', 'longitude'];
        numericFields.forEach(field => {
            if (data[field] === '' || data[field] === undefined) {
                data[field] = null;
            } else {
                data[field] = parseFloat(data[field]);
            }
        });

        // Clean up other optional empty strings to null for better DB hygiene
        Object.keys(data).forEach(key => {
            if (data[key] === '' && !['office_name', 'country', 'city'].includes(key)) {
                data[key] = null;
            }
        });

        try {
            if (currentEditId) {
                await API.offices.update(currentEditId, data);
            } else {
                await API.offices.create(data);
            }
            showToast(currentEditId ? 'Office asset updated' : 'New office registered successfully');
            officeModal.hide();
            if (navOffices.classList.contains('active')) {
                renderOfficesList();
            }
        } catch (error) {
            showToast('Error saving office: ' + error.message, 'danger');
        }
    });

    window.editOffice = (id) => {
        window.openOfficeModal(id);
    };

    window.deleteOffice = async (id) => {
        if (confirm('Are you sure you want to remove this office asset?')) {
            try {
                await API.offices.delete(id);
                showToast('Office asset removed successfully');
                renderOfficesList();
            } catch (error) {
                showToast('Error deleting office: ' + error.message, 'danger');
            }
        }
    };
});
