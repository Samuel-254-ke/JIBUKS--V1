import fetch from 'node-fetch';

async function run() {
  const url = 'http://localhost:4001/api/admin';
  
  // Register
  const regBody = {
    name: 'Admin Test',
    email: 'admin@test.com',
    password: 'password123',
    organization: 'Test Org'
  };
  console.log('Registering admin...');
  const regRes = await fetch(`${url}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regBody)
  });
  const regData = await regRes.json();
  console.log('Register Response:', regData);

  // Login
  console.log('\nLogging in admin...');
  const loginRes = await fetch(`${url}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  console.log('Login Response:', loginData.error ? loginData : 'Success! Token received');

  // Get Me
  if (loginData.accessToken) {
    console.log('\nFetching /me...');
    const meRes = await fetch(`${url}/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${loginData.accessToken}` }
    });
    const meData = await meRes.json();
    console.log('Me Response:', meData);
  }
}

run().catch(console.error);
