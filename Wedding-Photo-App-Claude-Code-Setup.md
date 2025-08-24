# Wedding Photo Sharing App - Claude Code Setup

This guide will help you set up and fix the QR code generation issue in your wedding photo sharing app using Claude Code in the terminal.

## Prerequisites

1. **Install Claude Code** (if not already installed):
```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code
```

2. **Verify Installation**:
```bash
claude-code --version
```

## Quick Fix Commands

### 1. Navigate to Your Project Directory
```bash
cd path/to/your/wedding-photos-app
```

### 2. Backup Current Files
```bash
# Create backup directory
mkdir backup-$(date +%Y%m%d)

# Backup current files
cp server.js backup-$(date +%Y%m%d)/
cp api-routes.js backup-$(date +%Y%m%d)/
cp routes.js backup-$(date +%Y%m%d)/
cp config.js backup-$(date +%Y%m%d)/
```

### 3. Use Claude Code to Fix QR Generation

```bash
# Fix the main API routes file
claude-code edit api-routes.js "Fix the QR code generation and add proper Cloudflare tunnel detection. The QR code should point to the /upload page and automatically detect if a tunnel is active. Add a /api/public-url endpoint that detects tunnel URLs and a /api/qr-upload endpoint specifically for generating upload QR codes."
```

```bash
# Fix the routes file with better JavaScript
claude-code edit routes.js "Fix the admin panel JavaScript to properly call the QR API endpoints. Add tunnel status detection, working QR code generation button, and PNG download functionality. The QR code should always point to the /upload page for guests."
```

```bash
# Update server.js for better error handling
claude-code edit server.js "Add comprehensive error handling, proper middleware setup, and ensure all API routes are correctly mounted. Add logging for debugging QR generation issues."
```

### 4. Install Missing Dependencies
```bash
# Install required packages for QR generation and tunnel detection
npm install qrcode axios
```

### 5. Add New API Endpoints (if needed)
```bash
# Create tunnel detection utilities
claude-code create utils/tunnel-detector.js "Create a TunnelDetector class that can detect active Cloudflare tunnels using multiple methods: process detection, metrics endpoints, log file parsing, and environment variables. Include caching and Windows compatibility."
```

### 6. Test the Fix
```bash
# Start the application
npm start
```

## Specific Code Fixes

### Fix QR Generation Button (JavaScript)
```bash
claude-code edit routes.js "Fix the generateQR() function in the admin panel. It should:
1. Call /api/public-url to get current URL
2. Call /api/qr?url={detected_url}/upload to generate QR
3. Display the QR image inline
4. Enable download button
5. Show proper error messages
6. Handle both tunnel and localhost scenarios"
```

### Add Tunnel Detection API
```bash
claude-code edit api-routes.js "Add a GET /api/public-url endpoint that:
1. Detects if Cloudflare tunnel is running
2. Returns the public tunnel URL if available
3. Falls back to localhost URL
4. Includes tunnel status boolean
5. Caches results for 30 seconds
6. Works on Windows systems"
```

### Fix QR Code Generation Endpoint
```bash
claude-code edit api-routes.js "Fix the GET /api/qr endpoint to:
1. Accept URL parameter
2. Validate the URL format
3. Generate QR code as PNG data URL
4. Return proper JSON response
5. Handle errors gracefully
6. Support download parameter for PNG files"
```

## Test Commands

### 1. Test API Endpoints
```bash
# Test public URL detection
curl http://localhost:3000/api/public-url

# Test QR generation
curl "http://localhost:3000/api/qr?url=http://localhost:3000/upload"

# Test health endpoint
curl http://localhost:3000/api/health
```

### 2. Start Cloudflare Tunnel (for testing)
```bash
# Start tunnel in separate terminal
cloudflared tunnel --url http://localhost:3000
```

### 3. Check Application Logs
```bash
# View application logs
npm start | tee app.log

# Monitor logs in real-time
tail -f app.log
```

## File Structure Check

```bash
# Verify all required files exist
claude-code analyze . "Check if all required files exist: server.js, api-routes.js, routes.js, config.js, package.json. List any missing files needed for a working wedding photo sharing app with QR generation."
```

## Common Issues and Fixes

### Issue 1: QR Button Not Working
```bash
claude-code edit routes.js "Debug the QR generation button. Add console.log statements, proper error handling, and ensure the button calls the correct API endpoint with proper error display."
```

### Issue 2: Tunnel Not Detected
```bash
claude-code edit api-routes.js "Improve tunnel detection by checking multiple methods: Windows tasklist, process arguments, metrics endpoints on ports 20241-20245, and environment variables."
```

### Issue 3: API Endpoints Not Found
```bash
claude-code edit server.js "Ensure API routes are properly mounted. Add middleware for /api prefix and verify all endpoints are accessible with proper CORS headers."
```

### Issue 4: File Upload Problems
```bash
claude-code edit api-routes.js "Fix file upload handling with proper multer configuration, file validation, and error responses. Ensure uploads directory exists and has proper permissions."
```

## Verification Steps

### 1. Check QR Generation
```bash
# Test QR generation directly
node -e "
const QRCode = require('qrcode');
QRCode.toDataURL('http://localhost:3000/upload', (err, url) => {
  if (err) console.error('QR Error:', err);
  else console.log('QR Generated Successfully:', url.length, 'characters');
});
"
```

### 2. Verify API Responses
```bash
# Check all API endpoints
echo "Testing API endpoints..."
curl -s http://localhost:3000/api/health && echo "✅ Health OK"
curl -s http://localhost:3000/api/public-url && echo "✅ Public URL OK"
curl -s "http://localhost:3000/api/qr?url=test" && echo "✅ QR Generation OK"
```

### 3. Test in Browser
```bash
# Open admin panel
echo "Open in browser: http://localhost:3000/"
echo "Test QR generation button in admin panel"
```

## Deployment with Tunnel

### 1. Start Application
```bash
# Terminal 1: Start the app
npm start
```

### 2. Start Cloudflare Tunnel
```bash
# Terminal 2: Start tunnel
cloudflared tunnel --url http://localhost:3000
```

### 3. Test Public Access
```bash
# The tunnel will provide a URL like: https://abc123.trycloudflare.com
# QR codes should automatically use this URL instead of localhost
```

## Complete Rebuild (if needed)

If you need to completely rebuild the app:

```bash
# Create new project structure
claude-code create wedding-photos-fixed/ "Create a complete wedding photo sharing app with:
- Working QR code generation
- Cloudflare tunnel detection
- File upload functionality
- Admin panel with real-time status
- Guest upload page
- Proper error handling
- All necessary dependencies"
```

## Package.json Update

```bash
# Update package.json with all required dependencies
claude-code edit package.json "Add all required dependencies: express, multer, qrcode, axios, archiver, express-rate-limit. Include scripts for start, dev, and test."
```

## Final Test Script

```bash
# Create a test script
claude-code create test-wedding-app.sh "Create a bash script that:
1. Starts the wedding app
2. Tests all API endpoints
3. Verifies QR generation
4. Checks file upload
5. Reports success/failure status
6. Includes cleanup commands"

# Make executable and run
chmod +x test-wedding-app.sh
./test-wedding-app.sh
```

## Success Indicators

✅ **QR Generation Working**: Button generates QR code without errors  
✅ **Tunnel Detection**: Admin panel shows tunnel status correctly  
✅ **File Upload**: Guests can upload photos successfully  
✅ **API Endpoints**: All /api/* endpoints respond properly  
✅ **Download QR**: PNG download works from admin panel  
✅ **Mobile Friendly**: Upload page works on mobile devices  

## Getting Help

If you encounter issues:

```bash
# Get detailed analysis
claude-code analyze . "Analyze this wedding photo app for QR generation issues. Check JavaScript errors, API endpoint problems, and provide specific fix commands."

# Debug specific file
claude-code debug routes.js "Debug the QR generation JavaScript in the admin panel. Find why the button isn't working and provide fix."
```

---

**Note**: Replace `path/to/your/wedding-photos-app` with your actual project directory path. This guide assumes you have Node.js and npm installed on your system.