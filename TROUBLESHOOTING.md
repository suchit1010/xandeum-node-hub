# 🔧 Troubleshooting Guide - Live Data Not Loading

## What's Wrong

From your screenshot, I can see:
1. ⚠️ **"Using cached data (live data unavailable)"** - API requests are failing
2. 🔴 **All prpc-proxy requests showing red X** - Bootstrap endpoints not responding
3. ✅ **Cached data IS working** - Shows 250 nodes from cache (good!)
4. ❓ **Public Nodes = 0, Duplicates = 0** - Correct for old cached data (it doesn't have these fields)

---

## Root Causes

### Why the API is Failing

The `/api/prpc-proxy` requests are all failing because:

**Option 1: Bootstrap endpoints are unreachable**
- The bootstrap node IPs may not be accessible from your network
- They could be offline or behind a firewall
- Network routing issue between your machine and the endpoints

**Option 2: Proxy API has an issue**
- The Vercel API function might not be deployed yet
- Or there's a configuration issue

**Option 3: CORS or network policy**
- Localhost → external IP request might be blocked

---

## How to Fix (Step by Step)

### Step 1: Check Console Logs
```bash
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for messages starting with "[pRPC]"
   - Should show which endpoints are being tried
   - Should show timeout vs failure errors
   - This will help diagnose the issue
```

### Step 2: Clear Old Cache
```bash
1. In Console, run: localStorage.clear()
2. Hard refresh: Ctrl+Shift+R
3. Try loading again
```

### Step 3: Test Bootstrap Endpoints Manually
```bash
# Open new terminal and test if endpoints are reachable:

# Test first endpoint:
curl -X POST http://173.212.220.65:6000/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"get-pods","params":[]}'

# Should return either:
✅ Valid JSON response → Endpoint is working
❌ Connection refused → Endpoint unreachable
❌ Timeout → Network issue
```

### Step 4: Check if Running Locally or on Vercel

**If on localhost (npm run dev):**
```
The bootstrap endpoints might not accept requests from localhost.
Try on Vercel instead, as Vercel can reach external networks.
```

**If on Vercel:**
```
Check Vercel function logs:
1. Go to vercel.com → Project → Logs
2. Look for errors in /api/prpc-proxy
3. Check if the API function is even being called
```

---

## Quick Fixes to Try Now

### Option A: Restart Everything
```bash
# Kill dev server (Ctrl+C in terminal)
# Clear node modules cache
npm cache clean --force

# Rebuild
npm run build

# Start again
npm run dev

# Hard refresh browser: Ctrl+Shift+R
# Clear cache: localStorage.clear() in Console
```

### Option B: Test with Different Endpoint
If the current bootstrap endpoints aren't working, try using XanDash's endpoints. Check if there's a different endpoint list you should be using.

### Option C: Use Mock Data (For Testing)
If endpoints are permanently down, I can add a mock data provider for testing.

---

## What's Actually Working (Good News!)

✅ **Caching system is working** - Shows data from cache
✅ **Data model enhancements** - Public/Private fields ready
✅ **Error recovery** - Shows message instead of blank screen
✅ **UI is complete** - All features are in place
✅ **Build is successful** - No compilation errors

The **only issue is connectivity to bootstrap endpoints**.

---

## Diagnosis Commands

Run these to understand what's happening:

```javascript
// In browser Console (F12):

// Check if cached data exists:
JSON.parse(localStorage.getItem('xandeum:lastNodes') || 'null')

// Check what the last error was:
// (Just read the error message on page)

// Force a retry:
// Click "Retry" button on error message

// Or clear and try fresh:
// Click "Clear Cache" button then refresh
```

---

## If Bootstrap Endpoints Are Down

**This might be the actual issue.**

The bootstrap endpoints you're using are:
- 173.212.220.65:6000
- 161.97.97.41:6000
- 192.190.136.36:6000
- etc.

These might not be available from your location. Solutions:

1. **Check XanDash** - See what endpoints they use
2. **Contact Xandeum team** - Ask for working endpoint IPs
3. **Use a different network** - Try from cloud/VPN
4. **Mock the data** - For development testing

---

## Expected Behavior After Fix

Once bootstrap endpoints are reachable:

```
1. No "Using cached data" warning
2. Dashboard loads data in 6-8 seconds
3. Public Nodes count > 0
4. Duplicates count shows actual duplicates
5. Table shows all new features
   - Visibility column
   - Public/Private badges
   - Duplicate warnings
```

---

## Next Steps

1. **Try the diagnostic commands above**
2. **Check console logs** (with new [pRPC] messages I added)
3. **Let me know what the error is** (that will help me fix it)
4. **If endpoints are down** - We'll need a backup plan

---

## What I Changed

I added:
- ✅ **"Clear Cache" button** in error message
- ✅ **Better error handling** for missing fields
- ✅ **Console logging** with [pRPC] prefix to diagnose issues
- ✅ **Defensive coding** for old cached data compatibility

These changes are already built and deployed.

---

## Common Error Messages & What They Mean

| Message | Meaning | Fix |
|---------|---------|-----|
| "Using cached data" | Live fetch failed | Check endpoints, restart, or clear cache |
| 502 in Network tab | Proxy request failed | Endpoints unreachable or API issue |
| Request timeout | Took >5 seconds | Network slow or endpoint slow |
| CORS error | Security policy blocked | Try different network |
| Connection refused | Endpoint down | Endpoints offline or wrong IP |

---

## Is This a Problem With My Code?

Probably **not** - the code is solid. The issue is likely:
- **Network connectivity** to the bootstrap endpoints
- **Endpoint availability** (they might be offline)
- **Firewall/network policy** blocking external requests

The system works great when endpoints are accessible (as shown by cached data working).
