require('dotenv').config();
console.log('Password from .env:', process.env.ADMIN_PASSWORD);
console.log('Password with quotes would be:', "'wesele2025!',");
console.log('Are they the same?', process.env.ADMIN_PASSWORD === "'wesele2025!',");

// Test what's in config
const config = require('./config');
console.log('Password from config:', config.ADMIN_PASSWORD);
console.log('Try logging in with this password');