# Mobile Push Notifications Testing Guide

## 🚀 Quick Setup for Mobile Testing

### Option 1: Using ngrok (Easiest)

```bash
# Terminal 1: Start your React app
npm run dev

# Terminal 2: Start ngrok tunnel
npx ngrok http 5173

# Terminal 3: Start your backend with ngrok (if needed)
# cd your-backend-directory
# npm start
# npx ngrok http 3000
```

### Option 2: Local Network HTTPS

```bash
# Install mkcert
npm install -g mkcert

# Create local CA
mkcert -install

# Find your local IP
# Windows: ipconfig
# Mac/Linux: ifconfig

# Generate certificate (replace with your IP)
mkcert localhost 192.168.1.100

# Update vite.config.ts with certificate paths
```

## 📱 Mobile Testing Steps

### 1. Setup Environment
- [ ] Get HTTPS URL (ngrok or local HTTPS)
- [ ] Ensure backend is accessible
- [ ] Update API URL if needed

### 2. Mobile Browser Testing
- [ ] Open HTTPS URL on mobile Chrome
- [ ] Login as admin user
- [ ] Navigate to Dashboard → Notifications tab

### 3. Test Notification Features
- [ ] Check "Browser Compatibility" status
- [ ] Click "Enable Notifications"
- [ ] Grant permission when prompted
- [ ] Verify "Notifications Active" status
- [ ] Click "Send Test" button
- [ ] Confirm notification appears
- [ ] Click notification to test navigation

### 4. Test Different Scenarios
- [ ] Test with mobile Safari (iOS)
- [ ] Test with mobile Firefox (Android)
- [ ] Test with app in background
- [ ] Test with screen locked
- [ ] Test notification actions (View Details, Dismiss)

## 🔍 Debugging Mobile Issues

### Check Browser Console
```javascript
// Open mobile browser dev tools
// Chrome mobile: chrome://inspect
// Safari mobile: Safari → Develop → [Device]

// Test in console:
console.log('Push supported:', 'PushManager' in window);
console.log('SW supported:', 'serviceWorker' in navigator);
console.log('Notification permission:', Notification.permission);
```

### Common Mobile Issues

1. **"Not Supported" Message**
   - Ensure using HTTPS
   - Check browser version
   - Try different mobile browser

2. **Permission Denied**
   - Clear browser data
   - Check site settings
   - Try incognito mode

3. **Service Worker Not Registering**
   - Check network tab for sw.js
   - Verify HTTPS connection
   - Check console for errors

4. **Notifications Not Appearing**
   - Check device notification settings
   - Verify browser notification permissions
   - Test with simple notification first

### Test Commands for Mobile Console

```javascript
// Test basic notification
new Notification('Test', { body: 'Testing mobile notifications' });

// Check service worker
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('SW registrations:', regs));

// Check push subscription
navigator.serviceWorker.ready
  .then(reg => reg.pushManager.getSubscription())
  .then(sub => console.log('Push subscription:', sub));
```

## 📊 Browser Support on Mobile

| Mobile Browser | Version | Push Support |
|----------------|---------|--------------|
| Chrome Android | 50+     | ✅ Full      |
| Safari iOS     | 16+     | ✅ Full      |
| Firefox Android| 44+     | ✅ Full      |
| Samsung Browser| 5.0+    | ✅ Full      |
| Edge Mobile    | 17+     | ✅ Full      |

## 🎯 Expected Results

### Successful Test Results:
- ✅ "Notifications Active" status in dashboard
- ✅ Test notification appears on mobile
- ✅ Clicking notification opens app/dashboard
- ✅ Notification includes ADIB branding
- ✅ Notification actions work (View Details, Dismiss)

### If Issues Occur:
1. Check HTTPS connection
2. Verify browser compatibility
3. Check notification permissions
4. Review browser console for errors
5. Test with different mobile browser

## 🔧 Environment Variables for Mobile Testing

```env
# Update .env for mobile testing
VITE_API_URL=https://your-ngrok-backend-url.ngrok.io

# Or for local network testing
VITE_API_URL=https://192.168.1.100:3000
```

## 📱 Real Device Testing Workflow

1. **Setup HTTPS tunnel**: `ngrok http 5173`
2. **Open on mobile**: Visit ngrok HTTPS URL
3. **Login as admin**: Use admin credentials
4. **Enable notifications**: Dashboard → Notifications → Enable
5. **Test functionality**: Send test notification
6. **Verify behavior**: Check notification appearance and click handling
7. **Test real scenarios**: Create reservation to trigger automatic notification

This setup allows you to test the complete push notification flow on real mobile devices while developing locally!