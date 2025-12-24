const axios = require('axios');

const targetUrl = process.env.PRPC_PROXY_URL || 'http://localhost:3001/api/prpc-proxy';
const rpcUrl = process.env.TARGET_PNODE || 'http://173.212.220.65:6000/rpc';

async function run() {
  try {
    console.log('Posting to proxy:', targetUrl, '->', rpcUrl);
    const res = await axios.post(targetUrl, {
      url: rpcUrl,
      payload: { jsonrpc: '2.0', id: 1, method: 'get-pods-with-stats', params: [] }
    }, { timeout: 30000 });

    const data = res.data;
    if (!data) {
      console.error('No response body');
      process.exit(2);
    }

    const result = data.result || data;
    const pods = Array.isArray(result) ? result : (result && result.pods) ? result.pods : null;
    if (!pods || !Array.isArray(pods) || pods.length === 0) {
      console.error('No pods found in response');
      console.error('Response sample:', JSON.stringify(Object.keys(data).slice(0,10)));
      process.exit(3);
    }

    console.log('OK - pods found:', pods.length);
    console.log('Sample pubkey:', pods[0].pubkey || '(none)');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err.message || err);
    process.exit(1);
  }
}

run();
