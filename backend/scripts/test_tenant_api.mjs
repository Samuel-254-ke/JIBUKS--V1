import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4001/api';
const ADMIN_EMAIL = 'apbcafricait@gmail.com';
const ADMIN_PASSWORD = 'admin123';

async function testApi() {
    try {
        console.log('🔑 Logging in as Admin...');
        const loginRes = await fetch(`${BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) {
            console.error('❌ Login failed:', loginData);
            return;
        }

        const token = loginData.accessToken;
        console.log('✅ Logged in successfully. Token obtained.');

        console.log('\n📊 Fetching Platform Stats...');
        const statsRes = await fetch(`${BASE_URL}/admin/management/tenants/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await statsRes.json();
        console.log(JSON.stringify(stats, null, 2));

        console.log('\n🏢 Fetching All Tenants (Extensive)...');
        const tenantsRes = await fetch(`${BASE_URL}/admin/management/tenants`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tenants = await tenantsRes.json();
        console.log(`✅ Found ${tenants.length} tenants.`);
        
        if (tenants.length > 0) {
            const first = tenants[0];
            console.log(`\n🔍 First Tenant [${first.name}] Stats:`, first.stats);
        }

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

testApi();
