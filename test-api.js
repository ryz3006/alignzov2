const fetch = require('node-fetch');

async function testAPI() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('Testing API endpoints...\n');
  
  // Test 1: Health check
  try {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    console.log('Health check:', healthResponse.status, healthResponse.statusText);
  } catch (error) {
    console.log('Health check failed:', error.message);
  }
  
  // Test 2: Users endpoint (should return 401 without auth)
  try {
    const usersResponse = await fetch(`${baseUrl}/api/users`);
    console.log('Users endpoint:', usersResponse.status, usersResponse.statusText);
    if (usersResponse.status === 401) {
      console.log('✅ Users endpoint is protected (expected)');
    }
  } catch (error) {
    console.log('Users endpoint failed:', error.message);
  }
  
  // Test 3: Roles endpoint (should return 401 without auth)
  try {
    const rolesResponse = await fetch(`${baseUrl}/api/roles`);
    console.log('Roles endpoint:', rolesResponse.status, rolesResponse.statusText);
    if (rolesResponse.status === 401) {
      console.log('✅ Roles endpoint is protected (expected)');
    }
  } catch (error) {
    console.log('Roles endpoint failed:', error.message);
  }
  
  // Test 4: Teams endpoint (should return 401 without auth)
  try {
    const teamsResponse = await fetch(`${baseUrl}/api/teams`);
    console.log('Teams endpoint:', teamsResponse.status, teamsResponse.statusText);
    if (teamsResponse.status === 401) {
      console.log('✅ Teams endpoint is protected (expected)');
    }
  } catch (error) {
    console.log('Teams endpoint failed:', error.message);
  }
}

testAPI().catch(console.error); 