# SecureX Phase 1: Company & User Management Foundations Build

## 🚀 Overview
SecureX is an advanced safety and security management system. Phase 1 focuses on the **Company & User Management Subsystem**, establishing a rock-solid multi-tenant foundation for all future security features (Locations, Risks, Analytics).

---

## 📁 System Architecture

### 🛡️ Backend (Node.js/Express/PostgreSQL)

#### `src/config/`
*   **`env.js`**: Centrally validates all environment variables using **Zod**. Ensures the system doesn't boot with missing critical configuration (DB URL, JWT Secret).
*   **`db.js`**: Manages the PostgreSQL connection pool using `pg`. Handles connection reuse and pooling for high-concurrency safety.

#### `src/middleware/`
*   **`auth.middleware.js`**: Protects routes by verifying JWT tokens and extracting user identity.
*   **`tenant.middleware.js`**: The core of our SaaS security. It enforces **Tenant Isolation** by extracting the `organization_id` from the JWT, ensuring users can never access data outside their company.
*   **`error.middleware.js`**: Standardizes error responses across the API and prevents leaking sensitive server information in production.
*   **`validate.middleware.js`**: Uses Zod schemas to validate incoming request bodies *before* they reach the service layer.

#### `src/modules/auth/`
*   **`auth.service.js`**: Contains the **Atomic Registration** logic. It uses a Database Transaction (`BEGIN`/`COMMIT/`ROLLBACK`) to create a Company and an Admin User simultaneously. If one fails, the other is reversed, preventing orphan records.
*   **`auth.controller.js`**: Handles HTTP request/response logic.
*   **`auth.routes.js`**: Defines the public end-points for Register and Login.

#### `src/utils/`
*   **`jwt.js`**: Handles secure token signing and verification.
*   **`password.js`**: Wraps `bcrypt` for secure hashing of user credentials.
*   **`logger.js`**: Uses **Pino** for high-performance, structured logging.

---

### 🎨 Frontend (Vanilla JS/Bootstrap 5/CSS)

#### Landing Page (`index.html`)
*   **3-Column Layout**: 50% Brand/Hero, 30% Informational, 20% Interactive Auth.
*   **Modern Auth Tabs**: A sleek interface to switch between Login and Register.
*   **Multi-Step Registration**: A sophisticated flow where clicking "Next" on the Company form triggers a smooth fade animation to the Admin User form.

#### Dashboard (`dashboard.html`)
*   **Professional Sidebar**: A feature-rich navigation menu with:
    *   **My Location**: Highlighted primary action button.
    *   **Tiered Menu**: Home, Alerts, Company Assets (Employees/Offices), and Global Analysis.
    *   **Iconic Footer**: Collapse and Logout icons separated by a vertical divider.

#### `frontend/js/`
*   **`api.js`**: A central communication utility that handles all fetch requests and automatically attaches the JWT token for authenticated routes.
*   **`auth.js`**: Manages all frontend authentication states, form transitions, and auto-login after registration.

#### `frontend/css/style.css`
*   Unified design language using **Glassmorphism**, smooth gradients, and custom animations (`fade-in`/`fade-out`) for a premium enterprise feel.

---

## 🏗️ Database Schema (PostgreSQL)

### `organizations`
Roots every tenant in the system.
*   `id` (UUID): Unique company identifier.
*   `name`, `slug`, `industry`: Company identity data.

### `users`
*   `id` (UUID): Unique user identifier.
*   `organization_id`: Hard reference to the company (ON DELETE CASCADE).
*   `email` (UNIQUE): Used for login.
*   `role`: Defaulted to 'admin' for the first user.

---

## 💎 Why This Approach?
1.  **Security**: Multi-tenancy is baked into the middleware, not an afterthought.
2.  **Scalability**: Proper indexing and UUIDs ensure the system can handle thousands of organizations.
3.  **User Experience**: The modern, tabbed interface and smooth transitions create a state-of-the-art impression for new users.

**Phase 1 provides the "Foundational Build" upon which the rest of SecureX is being constructed.**
