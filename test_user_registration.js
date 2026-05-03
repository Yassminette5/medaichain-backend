const http = require('http');

// Test user registration to trigger wallet creation and see logs
const registerData = {
  email: `test${Date.now()}@example.com`,
  password: 'TestPassword123!',
  phone: `+213555${Math.floor(Math.random() * 10000)}`,
  role: 'patient',
  fullName: 'Test User'
};

const data = JSON.stringify(registerData);

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Testing user registration with wallet creation...');
console.log('Request data:', registerData);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      console.log('Response:', JSON.stringify(response, null, 2));

      if (response.walletOnChainRegistrationStatus === 'failed') {
        console.log('❌ Wallet registration failed! Check backend logs for detailed error information.');
      } else if (response.walletOnChainRegistrationStatus === 'registered') {
        console.log('✅ Wallet registration successful!');
      } else {
        console.log('⚠️  Wallet registration status:', response.walletOnChainRegistrationStatus);
      }
    } catch (e) {
      console.log('Raw response body:', body);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request failed: ${e.message}`);
  console.log('Make sure the backend is running on port 3000');
});

req.write(data);
req.end();