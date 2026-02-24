/**
 * SecureX - Employee Asset Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    const contentContainer = document.getElementById('dashboard-content');
    const navEmployees = document.getElementById('nav-employees');
    const navHome = document.getElementById('nav-home');
    const navOffices = document.getElementById('nav-offices');

    // Auth Check: Force Password Reset
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('forceReset') === 'true') {
        const resetModal = new bootstrap.Modal(document.getElementById('passwordResetModal'));
        resetModal.show();
    }

    // Form & Modal
    const employeeForm = document.getElementById('employee-form');
    const employeeModal = new bootstrap.Modal(document.getElementById('employeeModal'));
    const modalTitle = document.getElementById('employeeModalLabel');
    const officeSelect = document.getElementById('employee-office-select');

    // Auth State
    const user = JSON.parse(localStorage.getItem('sx_user') || '{}');
    const userRole = user.role || 'employee';

    let currentEditId = null;
    let homeBaselineHtml = contentContainer.innerHTML;

    // --- Navigation ---

    if (navEmployees) {
        navEmployees.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveNav(navEmployees);
            loadEmployeesView();
        });
    }

    function setActiveNav(el) {
        document.querySelectorAll('.nav-item, .submenu-item').forEach(item => item.classList.remove('active'));
        el.classList.add('active');
        if (el.classList.contains('submenu-item')) {
            el.closest('div').previousElementSibling.classList.add('active');
        }
    }

    // --- View Rendering ---

    async function loadEmployeesView() {
        contentContainer.innerHTML = `
            <div class="content-grid">
                <!-- Column 1: Employee List -->
                <div class="grid-main">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2 class="h4 fw-bold">Employee Registry</h2>
                        ${userRole === 'admin' ? `
                        <button class="btn btn-primary btn-sm" onclick="openEmployeeModal()">
                            <i class="bi bi-person-plus me-2"></i> Add Employee
                        </button>` : ''}
                    </div>
                    
                    <div class="glass-card p-0 overflow-hidden">
                        <table class="table table-dark table-hover mb-0">
                            <thead>
                                <tr>
                                    <th class="ps-4 py-3 small fw-bold">NAME</th>
                                    <th class="py-3 small fw-bold">ROLE</th>
                                    <th class="py-3 small fw-bold">OFFICE</th>
                                    <th class="py-3 small fw-bold">STATUS</th>
                                    <th class="pe-4 py-3 text-end small fw-bold">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody id="employees-table-body">
                                <tr>
                                    <td colspan="5" class="text-center py-5">
                                        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                                        Loading identity records...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Vertical Separator -->
                <div class="vertical-separator"></div>

                <!-- Column 2: Employee Details & Records -->
                <div class="grid-side">
                    <div class="secondary-tabs h-100" id="employee-details-pane">
                        <div class="tab-placeholder-content">
                            <i class="bi bi-person-vcard fs-1 mb-3"></i>
                            <p class="small">Select an employee to view their full profile and safety records.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        renderEmployeesList();
    }

    async function renderEmployeesList() {
        const tbody = document.getElementById('employees-table-body');
        try {
            const result = await API.users.getAll();
            const users = result.data;

            if (users.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5 opacity-50">No employees registered.</td></tr>`;
                return;
            }

            // Fetch offices for display names
            const officesRes = await API.offices.getAll();
            const officesMap = Object.fromEntries(officesRes.data.map(o => [o.id, o.office_name]));

            tbody.innerHTML = users.map(user => `
                <tr id="row-${user.id}" class="align-middle clickable-row" onclick="viewEmployeeDetails('${user.id}')">
                    <td class="ps-4">
                        <div class="fw-bold text-white">${user.first_name} ${user.last_name}</div>
                        <div class="x-small text-secondary">${user.email}</div>
                    </td>
                    <td>
                        <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 text-capitalize">${user.role}</span>
                    </td>
                    <td>
                        <div class="small">${officesMap[user.office_id] || 'Field / Unassigned'}</div>
                    </td>
                    <td>
                        <span class="small ${user.is_active ? 'text-success' : 'text-danger'}">
                            <i class="bi bi-circle-fill x-small me-2"></i>${user.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td class="pe-4 text-end">
                        ${userRole === 'admin' ? `
                        <button class="btn btn-link text-primary p-1" onclick="event.stopPropagation(); editEmployee('${user.id}')" title="Edit">
                            <i class="bi bi-pencil-square"></i>
                        </button>` : '<span class="x-small text-secondary opacity-50">Read Only</span>'}
                    </td>
                </tr>
            `).join('');

        } catch (error) {
            const subtitle = error.message.includes('Forbidden') ?
                'Access denied. Your role does not have permission to view high-security identity records.' :
                error.message;
            renderErrorView('employees-table-body', error.message, subtitle);
        }
    }

    // --- Employee Details Pane ---

    window.viewEmployeeDetails = async (id) => {
        // Highlight Active Row
        document.querySelectorAll('.clickable-row').forEach(row => row.classList.remove('active-row'));
        const activeRow = document.getElementById(`row-${id}`);
        if (activeRow) activeRow.classList.add('active-row');

        const pane = document.getElementById('employee-details-pane');
        pane.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div></div>`;

        try {
            const result = await API.users.getById(id);
            const user = result.data;
            const officesRes = await API.offices.getAll();
            const office = officesRes.data.find(o => o.id === user.office_id);

            pane.innerHTML = `
                <div class="d-flex align-items-center mb-4">
                    <div class="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center me-3" style="width: 48px; height: 48px;">
                        <span class="h5 mb-0 fw-bold text-primary">${user.first_name[0]}${user.last_name[0]}</span>
                    </div>
                    <div>
                        <h3 class="h5 fw-bold mb-0">${user.first_name} ${user.last_name}</h3>
                        <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 text-capitalize">${user.role}</span>
                    </div>
                </div>

                <ul class="nav nav-pills nav-pills-custom mb-4" id="employeeTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="info-tab" data-bs-toggle="pill" data-bs-target="#info-pane" type="button">Profile Info</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="safety-tab" data-bs-toggle="pill" data-bs-target="#safety-pane" type="button">Safety Record</button>
                    </li>
                </ul>

                <div class="tab-content">
                    <div class="tab-pane fade show active" id="info-pane">
                        <div class="mb-3">
                            <label class="x-small text-uppercase fw-bold opacity-50 mb-1">Email</label>
                            <div class="small">${user.email}</div>
                        </div>
                        <div class="mb-3">
                            <label class="x-small text-uppercase fw-bold opacity-50 mb-1">Office Location</label>
                            <div class="small">${office ? office.office_name : 'No office assigned'}</div>
                        </div>
                        <div class="mb-4">
                            <label class="x-small text-uppercase fw-bold opacity-50 mb-1">Employee ID</label>
                            <div class="small opacity-50">${user.id}</div>
                        </div>
                        
                        ${userRole === 'admin' ? `
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="editEmployee('${user.id}')">
                                <i class="bi bi-pencil me-2"></i> Edit Account
                            </button>
                            <button class="btn btn-outline-${user.is_active ? 'danger' : 'success'} btn-sm" onclick="toggleStatus('${user.id}', ${!user.is_active})">
                                <i class="bi bi-power me-2"></i> ${user.is_active ? 'Deactivate Account' : 'Activate Account'}
                            </button>
                        </div>` : ''}
                    </div>
                    <div class="tab-pane fade" id="safety-pane">
                        <div class="tab-placeholder-content py-4">
                            <i class="bi bi-shield-check fs-2 mb-2"></i>
                            <p class="small">No safety submissions recorded for this employee.</p>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            pane.innerHTML = `<div class="alert alert-danger small">${error.message}</div>`;
        }
    };

    // --- Form Handling ---

    window.openEmployeeModal = async (id = null) => {
        currentEditId = id;
        employeeForm.reset();
        modalTitle.textContent = id ? 'Edit Employee account' : 'Register New Employee';

        // Populate Office Select
        const officesRes = await API.offices.getAll();
        officeSelect.innerHTML = '<option value="">No Office Assigned</option>' +
            officesRes.data.map(o => `<option value="${o.id}">${o.office_name}</option>`).join('');

        if (id) {
            const res = await API.users.getById(id);
            const data = res.data;
            Object.keys(data).forEach(key => {
                const input = employeeForm.elements[key];
                if (input) input.value = data[key] || '';
            });
            // Password not needed for edit for now
            document.getElementById('employee-password').required = false;
        } else {
            document.getElementById('employee-password').required = true;
        }

        employeeModal.show();
    };

    window.generatePassword = () => {
        const pass = Math.random().toString(36).slice(-10) + 'A1!';
        document.getElementById('employee-password').value = pass;
        document.getElementById('employee-password').type = 'text';
    };

    employeeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(employeeForm);
        const data = Object.fromEntries(formData.entries());
        if (data.office_id === '') data.office_id = null;

        try {
            if (currentEditId) {
                await API.users.update(currentEditId, data);
            } else {
                await API.users.create(data);
            }
            showToast(currentEditId ? 'Employee record updated' : 'New employee registered successfully');
            employeeModal.hide();
            renderEmployeesList();
        } catch (error) {
            showToast('Error saving employee: ' + error.message, 'danger');
        }
    });

    window.editEmployee = (id) => {
        window.openEmployeeModal(id);
    };

    window.toggleStatus = async (id, isActive) => {
        if (confirm(`Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this account?`)) {
            try {
                await API.users.toggleStatus(id, isActive);
                showToast(`Employee account ${isActive ? 'activated' : 'deactivated'}`);
                renderEmployeesList();
                viewEmployeeDetails(id);
            } catch (error) {
                showToast('Action failed: ' + error.message, 'danger');
            }
        }
    };

    // --- Password Reset Flow ---
    const resetForm = document.getElementById('password-reset-form');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const { newPassword, confirmPassword } = Object.fromEntries(new FormData(resetForm).entries());

            if (newPassword !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            try {
                await API.auth.changePassword(newPassword);
                const resetModal = bootstrap.Modal.getInstance(document.getElementById('passwordResetModal'));
                resetModal.hide();
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                showToast('Password updated successfully! Welcome to SecureX.');
            } catch (error) {
                showToast('Update failed: ' + error.message, 'danger');
            }
        });
    }
});
