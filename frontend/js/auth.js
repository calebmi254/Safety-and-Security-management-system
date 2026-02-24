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

    // --- Tab Switching ---

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

    // --- Multi-step Registration Navigation ---

    // Step 1 -> Step 2
    nextBtn.addEventListener('click', () => {
        const orgName = document.getElementById('reg-org-name').value;
        const orgIndustry = document.getElementById('reg-org-industry').value;

        if (!orgName || !orgIndustry) {
            showStatus('Please fill in company details', 'text-warning');
            return;
        }

        registerData.organizationName = orgName;
        registerData.industry = orgIndustry;

        // Animate transition (Fade Out Step 1)
        registerStep1.classList.add('fade-out');
        setTimeout(() => {
            registerStep1.classList.add('d-none');
            registerStep1.classList.remove('fade-out');

            // Fade In Step 2
            registerStep2.classList.remove('d-none');
            registerStep2.classList.add('fade-in');
            setTimeout(() => registerStep2.classList.remove('fade-in'), 400);
        }, 350);
    });

    // Step 2 -> Step 1
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

    // --- Form Submissions ---

    // Registration Final Submit
    registerStep2.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('reg-admin-name').value;
        const email = document.getElementById('reg-admin-email').value;
        const password = document.getElementById('reg-admin-password').value;

        const finalData = {
            ...registerData,
            name,
            email,
            password
        };

        try {
            showStatus('Initializing secure environment...', 'text-primary');
            const result = await API.auth.register(finalData);

            showStatus('Registration successful! Authenticating...', 'text-success');

            // Auto login after successful register
            const loginResult = await API.auth.login({ email, password });

            localStorage.setItem('sx_token', loginResult.data.token);
            localStorage.setItem('sx_user', JSON.stringify(loginResult.data.user));

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);

        } catch (error) {
            showStatus(error.message, 'text-danger');
        }
    });

    // Login Submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            showStatus('Establishing secure connection...', 'text-primary');
            const result = await API.auth.login({ email, password });

            localStorage.setItem('sx_token', result.data.token);
            localStorage.setItem('sx_user', JSON.stringify(result.data.user));

            showStatus('Access Granted.', 'text-success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);

        } catch (error) {
            showStatus(error.message, 'text-danger');
        }
    });

    function showStatus(msg, className) {
        authStatus.textContent = msg;
        authStatus.className = `mt-4 small text-center fw-bold ${className}`;
        authStatus.classList.remove('d-none');
    }
});
