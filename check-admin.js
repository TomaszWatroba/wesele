const fs = require('fs');
const path = require('path');

console.log('🔍 Admin Panel Access Diagnostic Tool');

// Check views directory
const viewsDir = path.join(__dirname, 'views');
console.log(`Checking views directory at ${viewsDir}...`);
if (!fs.existsSync(viewsDir)) {
    console.log('❌ Views directory not found - creating it');
    fs.mkdirSync(viewsDir, { recursive: true });
} else {
    console.log('✅ Views directory exists');
}

// Check admin template files
const adminLoginPath = path.join(viewsDir, 'admin-login.html');
const adminPanelPath = path.join(viewsDir, 'admin-panel.html');

console.log(`Checking admin-login.html...`);
if (!fs.existsSync(adminLoginPath)) {
    console.log('❌ admin-login.html not found in views directory');
    // Check if it exists in root
    const rootLoginPath = path.join(__dirname, 'admin-login.html');
    if (fs.existsSync(rootLoginPath)) {
        console.log('🔄 Found admin-login.html in root, copying to views directory');
        fs.copyFileSync(rootLoginPath, adminLoginPath);
        console.log('✅ admin-login.html copied to views directory');
    } else {
        console.log('⚠️ admin-login.html not found in root or views directory');
    }
} else {
    console.log('✅ admin-login.html exists in views directory');
}

console.log(`Checking admin-panel.html...`);
if (!fs.existsSync(adminPanelPath)) {
    console.log('❌ admin-panel.html not found in views directory');
    // Check if it exists in root
    const rootPanelPath = path.join(__dirname, 'admin-panel.html');
    if (fs.existsSync(rootPanelPath)) {
        console.log('🔄 Found admin-panel.html in root, copying to views directory');
        fs.copyFileSync(rootPanelPath, adminPanelPath);
        console.log('✅ admin-panel.html copied to views directory');
    } else {
        console.log('⚠️ admin-panel.html not found in root or views directory');
    }
} else {
    console.log('✅ admin-panel.html exists in views directory');
}

// Check config.js for file size limits
try {
    const configPath = path.join(__dirname, 'config.js');
    const configContent = fs.readFileSync(configPath, 'utf8');
    console.log(`Checking file size limits in config.js...`);
    
    if (configContent.includes('MAX_FILE_SIZE:')) {
        const sizeMatch = configContent.match(/MAX_FILE_SIZE:\s*(\d+)\s*\*/);
        if (sizeMatch && sizeMatch[1]) {
            const currentSize = parseInt(sizeMatch[1]);
            console.log(`Current MAX_FILE_SIZE: ${currentSize}MB`);
            if (currentSize < 4000) {
                console.log('⚠️ Consider increasing MAX_FILE_SIZE for longer videos');
            } else {
                console.log('✅ MAX_FILE_SIZE is adequate for longer videos');
            }
        }
    }
} catch (error) {
    console.log('❌ Error checking config.js:', error.message);
}

console.log('\n📋 Summary:');
console.log('1. Make sure both admin-login.html and admin-panel.html exist in the views directory');
console.log('2. Ensure proper admin routes are configured in server.js');
console.log('3. Update MAX_FILE_SIZE in config.js for longer videos');
console.log('\n👉 Run the server with "node server.js" and try accessing /admin/login again');