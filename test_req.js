const http = require('http');

async function test() {
  const req = http.request('http://127.0.0.1:3000/clinic-management/clinic/69a2ff0f55b4e231354a5424/appointments', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer test' } // This will return 401 if backend is up! 500 if backend is crashing before auth! No wait, 401 is normal. But if the token is valid, it might crash.
  }, (res) => {
    console.log('Status:', res.statusCode);
  });
  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });
  req.end();
}

test();
