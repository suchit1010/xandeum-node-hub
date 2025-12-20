(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/prpc-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'http://173.212.220.65:6000/rpc',
        payload: { jsonrpc: '2.0', id: 1, method: 'get-pods-with-stats', params: [] },
      }),
    });
    const text = await res.text();
    console.log('Response length:', text.length);
    console.log(text.slice(0, 2000));
  } catch (e) {
    console.error('Request failed:', e);
  }
})();
