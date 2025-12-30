const http = require('http');

http.get('http://127.0.0.1:3000/users', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Raw response:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('✅ Parsed JSON:', parsed);
    } catch (err) {
      console.error('❌ Failed to parse JSON:', err.message);
    }
  });
}).on('error', err => {
  console.error('❌ Request error details:', err);
});