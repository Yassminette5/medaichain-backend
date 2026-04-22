const http = require('http');

async function test() {
  // Use port 3000 since that's what the user is running
  const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/clinic-management/clinic/mine',
    method: 'GET',
    headers: {
        // We don't have a real token here easily, but we can see if it's a 401 or a crash
    }
  };

  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log(`BODY: ${body}`);
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error(`ERROR: ${e.message}`);
    process.exit(1);
  });

  req.end();
}

test();
