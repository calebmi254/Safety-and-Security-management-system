document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const loginForm = document.getElementById('login-form');
    const registerContainer = document.getElementById('register-container');
    const registerStep1 = document.getElementById('register-step-1');
    const registerStep2 = document.getElementById('register-step-2');

    // Modern Tabs
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    const nextBtn = document.getElementById('next-to-admin');
    const backBtn = document.getElementById('back-to-org');
    const authStatus = document.getElementById('auth-status');

    // State
    let registerData = {};

    // --- Helper for Status ---
    function showStatus(msg, className) {
        if (!authStatus) return;
        authStatus.textContent = msg;
        authStatus.className = `mt-4 small text-center fw-bold ${className}`;
        authStatus.classList.remove('d-none');
    }

    // --- Tab Switching ---
    if (tabLogin && tabRegister && loginForm && registerContainer) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            loginForm.classList.remove('d-none');
            registerContainer.classList.add('d-none');
        });

        tabRegister.addEventListener('click', () => {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            registerContainer.classList.remove('d-none');
            loginForm.classList.add('d-none');
        });
    }

    // --- Multi-step Registration Navigation ---

    if (nextBtn && registerStep1 && registerStep2) {
        nextBtn.addEventListener('click', () => {
            const orgNameEl = document.getElementById('reg-org-name');
            const orgIndustryEl = document.getElementById('reg-org-industry');

            if (!orgNameEl || !orgIndustryEl) return;

            const orgName = orgNameEl.value;
            const orgIndustry = orgIndustryEl.value;

            if (!orgName || !orgIndustry) {
                showStatus('Please fill in company details', 'text-warning');
                return;
            }

            registerData.organizationName = orgName;
            registerData.industry = orgIndustry;

            registerStep1.classList.add('fade-out');
            setTimeout(() => {
                registerStep1.classList.add('d-none');
                registerStep1.classList.remove('fade-out');
                registerStep2.classList.remove('d-none');
                registerStep2.classList.add('fade-in');
                setTimeout(() => registerStep2.classList.remove('fade-in'), 400);
            }, 350);
        });
    }

    if (backBtn && registerStep1 && registerStep2) {
        backBtn.addEventListener('click', () => {
            registerStep2.classList.add('fade-out');
            setTimeout(() => {
                registerStep2.classList.add('d-none');
                registerStep2.classList.remove('fade-out');
                registerStep1.classList.remove('d-none');
                registerStep1.classList.add('fade-in');
                setTimeout(() => registerStep1.classList.remove('fade-in'), 400);
            }, 350);
        });
    }

    // --- Form Submissions ---

    if (registerStep2) {
        registerStep2.addEventListener('submit', async (e) => {
            e.preventDefault();

            const adminFirstName = document.getElementById('reg-admin-first-name')?.value;
            const adminLastName = document.getElementById('reg-admin-last-name')?.value;
            const email = document.getElementById('reg-admin-email')?.value;
            const password = document.getElementById('reg-admin-password')?.value;

            if (!email || !password) return;

            const finalData = {
                ...registerData,
                firstName: adminFirstName,
                lastName: adminLastName,
                email,
                password
            };

            try {
                showStatus('Initializing secure environment...', 'text-primary');
                await API.auth.register(finalData);
                showStatus('Registration successful! Authenticating...', 'text-success');

                const loginResult = await API.auth.login({ email, password });
                localStorage.setItem('sx_token', loginResult.data.token);
                localStorage.setItem('sx_user', JSON.stringify(loginResult.data.user));

                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
            } catch (error) {
                showStatus(error.message, 'text-danger');
                showToast(error.message, 'danger');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email')?.value;
            const password = document.getElementById('login-password')?.value;

            if (!email || !password) return;

            try {
                showStatus('Establishing secure connection...', 'text-primary');
                const result = await API.auth.login({ email, password });

                localStorage.setItem('sx_token', result.data.token);
                localStorage.setItem('sx_user', JSON.stringify(result.data.user));

                if (result.data.user.mustChangePassword) {
                    showStatus('Security Reset Required.', 'text-warning');
                    setTimeout(() => { window.location.href = 'dashboard.html?forceReset=true'; }, 800);
                } else {
                    showStatus('Access Granted.', 'text-success');
                    showToast('Welcome back to SecureX', 'success');
                    setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
                }
            } catch (error) {
                showStatus(error.message, 'text-danger');
                showToast(error.message, 'danger');
            }
        });
    }
});
