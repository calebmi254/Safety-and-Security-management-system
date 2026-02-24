const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const API_URL = `http://localhost:${process.env.PORT || 5000}/api/auth`;

// Connection for verification
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function testAtomicRegistration() {
    console.log('🧪 Starting Atomic Registration Test...');

    const testData = {
        name: 'Test Admin',
        email: `admin_${Date.now()}@testsecurex.com`,
        password: 'password123',
        organizationName: `Test Org ${Date.now()}`,
    };

    try {
        // 1. Call the API
        console.log(`📡 Sending POST request to ${API_URL}/register...`);
        const response = await axios.post(`${API_URL}/register`, testData);

        console.log('✅ API Response:', response.data);

        const { userId, organizationId } = response.data.data;

        // 2. Verify in Database
        console.log('🔍 Verifying database state...');

        const orgCheck = await pool.query('SELECT * FROM organizations WHERE id = $1', [organizationId]);
        const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

        if (orgCheck.rows.length > 0 && userCheck.rows.length > 0) {
            console.log('🎉 SUCCESS: Company and User created successfully!');
            console.log('🏢 Company:', orgCheck.rows[0].name);
            console.log('👤 Admin User:', userCheck.rows[0].email);
            console.log('🔗 Link Verified: User belongs to Org ID', userCheck.rows[0].organization_id);
        } else {
            console.error('❌ FAILURE: Data missing in database.');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
    } finally {
        await pool.end();
    }
}

testAtomicRegistration();
