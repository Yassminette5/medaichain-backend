const jwt = require('jsonwebtoken');
const http = require('http');
const secret = 'votre-secret-jwt-super-secure-changez-moi';

// The REAL token format uses 'sub', not 'userId'
const token = jwt.sign({ sub: '69a22226b90a998bdad3cc19', email: 'maramrzeigui14@gmail.com', role: 'clinique' }, secret, { expiresIn: '1h' });

console.log('Token created');

// Step 1: Get clinic via /clinic/mine
const req1 = http.request('http://127.0.0.1:3000/clinic-management/clinic/mine', {
  method: 'GET',
  headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log('=== Step 1: clinic/mine ===');
    console.log('Status:', res.statusCode);
    
    if (res.statusCode !== 200) {
      console.log('FAILED Body:', body);
      process.exit(1);
    }
    
    const clinic = JSON.parse(body);
    console.log('Clinic ID:', clinic._id);
    console.log('Clinic Name:', clinic.name);
    
    // Step 2: Get appointments
    const req2 = http.request('http://127.0.0.1:3000/clinic-management/clinic/' + clinic._id + '/appointments', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    }, (res2) => {
      let body2 = '';
      res2.on('data', d => body2 += d);
      res2.on('end', () => {
        console.log('=== Step 2: appointments ===');
        console.log('Status:', res2.statusCode);
        const appts = JSON.parse(body2);
        console.log('Count:', Array.isArray(appts) ? appts.length : 'NOT ARRAY');
        if (Array.isArray(appts) && appts.length > 0) {
          console.log('First appt noShowProbability:', appts[0].noShowProbability);
          console.log('First appt patientName:', appts[0].patientName);
        }
        process.exit(0);
      });
    });
    req2.on('error', e => { console.error('Step 2 error:', e.message); process.exit(1); });
    req2.end();
  });
});
req1.on('error', e => { console.error('Step 1 error:', e.message); process.exit(1); });
req1.end();
