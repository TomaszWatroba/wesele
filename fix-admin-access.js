// fix-admin-access.js
// This script fixes the admin panel access by copying template files to the correct locations
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting admin panel fix...');

// 1. Ensure views directory exists
const viewsDir = path.join(__dirname, 'views');
if (!fs.existsSync(viewsDir)) {
    console.log('📁 Creating views directory...');
    fs.mkdirSync(viewsDir, { recursive: true });
}

// 2. Check for admin.html in the project root and copy it to views/admin.html
const rootAdminHtml = path.join(__dirname, 'admin.html');
const viewsAdminHtml = path.join(viewsDir, 'admin.html');
const viewsAdminLoginHtml = path.join(viewsDir, 'admin-login.html');
const viewsAdminPanelHtml = path.join(viewsDir, 'admin-panel.html');

// Check and copy admin.html
if (fs.existsSync(rootAdminHtml)) {
    console.log('📋 Copying admin.html to views directory...');
    fs.copyFileSync(rootAdminHtml, viewsAdminHtml);
} else if (!fs.existsSync(viewsAdminHtml)) {
    console.log('❌ admin.html not found in project root or views directory!');
    console.log('👉 Please manually create admin.html in the views directory.');
}

// Check and copy admin-login.html
const rootAdminLoginHtml = path.join(__dirname, 'admin-login.html');
if (fs.existsSync(rootAdminLoginHtml)) {
    console.log('📋 Copying admin-login.html to views directory...');
    fs.copyFileSync(rootAdminLoginHtml, viewsAdminLoginHtml);
} else if (!fs.existsSync(viewsAdminLoginHtml)) {
    console.log('❌ admin-login.html not found in project root or views directory!');
    console.log('👉 Please manually create admin-login.html in the views directory.');
}

// Check and copy admin-panel.html
const rootAdminPanelHtml = path.join(__dirname, 'admin-panel.html');
if (fs.existsSync(rootAdminPanelHtml)) {
    console.log('📋 Copying admin-panel.html to views directory...');
    fs.copyFileSync(rootAdminPanelHtml, viewsAdminPanelHtml);
} else if (!fs.existsSync(viewsAdminPanelHtml)) {
    console.log('❌ admin-panel.html not found in project root or views directory!');
    console.log('👉 Please manually create admin-panel.html in the views directory.');
}

// 3. Update config.js to increase file size limit
try {
    const configPath = path.join(__dirname, 'config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Increase MAX_FILE_SIZE to 4GB
    configContent = configContent.replace(
        /MAX_FILE_SIZE: \d+ \* 1024 \* 1024,/,
        'MAX_FILE_SIZE: 4000 * 1024 * 1024, // 4GB (increased from 2GB)'
    );
    
    // Increase UPLOAD_TIMEOUT to 10 minutes
    configContent = configContent.replace(
        /UPLOAD_TIMEOUT: \d+ \* 60 \* 1000,/,
        'UPLOAD_TIMEOUT: 10 * 60 * 1000, // 10 minutes (increased from 5 minutes)'
    );
    
    fs.writeFileSync(configPath, configContent);
    console.log('✅ Updated config.js with increased file size limits');
} catch (error) {
    console.error('❌ Failed to update config.js:', error);
}

console.log('🎉 Admin panel fix completed!');
console.log('👉 Please restart your server for changes to take effect.');
console.log('📝 Login with password from config.js: wedding2025! (unless you changed it)');