const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

app.post('/api/prpc-proxy', async (req, res) => {
  const { url, payload } = req.body;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Proxy failed', details: e.message });
  }
});

app.listen(3001, () => {
  console.log('Proxy server running on http://localhost:3001');
});