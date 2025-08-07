// server.js - Główny plik serwera (uproszczony)
const express = require('express');
const config = require('./config');
const { initializeDirectories, logActivity } = require('./utils');
const { securityMiddleware, protectFilesMiddleware, notFoundHandler, errorHandler } = require('./middleware');

// Import tras
const mainRoutes = require('./routes');
const apiRoutes = require('./api-routes');

const app = express();

// 🔧 Inicjalizacja
initializeDirectories();

// 🛡️ Middleware globalne
app.use(securityMiddleware);
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔍 Debug middleware - loguj wszystkie żądania
app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path}`);
    next();
});

// 📷 Zabezpieczenie dostępu do plików - tylko odczyt
app.use('/uploads', protectFilesMiddleware, express.static(config.UPLOADS_DIR));

// 🛣️ Trasy - POPRAWIONA KOLEJNOŚĆ
app.use('/', mainRoutes);           // Strony HTML na końcu
app.use('/api', apiRoutes);         // API endpoints NAJPIERW

// 🚨 Obsługa błędów
app.use('*', notFoundHandler);      // 404
app.use(errorHandler);              // Błędy serwera

// 🚀 Uruchomienie serwera
app.listen(config.PORT, '0.0.0.0', () => {
    const startupMessage = `
🎉 Wedding Photos uruchomione!

📍 Panel organizatora: http://localhost:${config.PORT}
📱 Strona dla gości: http://localhost:${config.PORT}/upload
📊 Statystyki: http://localhost:${config.PORT}/logs
📁 Zdjęcia zapisywane w: ${config.UPLOADS_DIR}
📋 Logi w: ${config.LOG_FILE}

✨ FUNKCJE:
- ✅ ZERO haseł - maksymalna prostota dla gości
- ✅ Pliki RAZ przesłane = NA ZAWSZE bezpieczne
- ✅ Automatyczna ochrona przed usuwaniem
- ✅ Rate limiting (${config.RATE_LIMIT.MAX_UPLOADS} przesłań / ${config.RATE_LIMIT.WINDOW_MS/1000/60} min)
- ✅ Obsługa zdjęć i filmów (do ${config.MAX_FILE_SIZE/1024/1024}MB)

🛡️ BEZPIECZEŃSTWO:
- ✅ Tylko upload i odczyt - ZERO usuwania
- ✅ Bezpieczne nazwy plików (losowe)
- ✅ Walidacja typów plików
- ✅ Blokada niebezpiecznych metod HTTP
- ✅ Logi aktywności

💡 NASTĘPNE KROKI:
1. Zmień EVENT_NAME w config.js na swoją nazwę
2. Uruchom Cloudflare Tunnel: cloudflared tunnel --url http://localhost:${config.PORT}
3. Wygeneruj QR kod w panelu organizatora
4. Wydrukuj QR kod dla gości
5. Gotowe! 🚀

🌐 TUNELOWANIE:
Aby udostępnić przez internet, uruchom w nowym oknie PowerShell:
cloudflared tunnel --url http://localhost:${config.PORT}
    `;
    
    console.log(startupMessage);
    logActivity('SERVER_STARTED', `Wedding Photos app started on port ${config.PORT}`);
    logActivity('CONFIG_LOADED', `Event: ${config.EVENT_NAME}, Max file size: ${config.MAX_FILE_SIZE/1024/1024}MB`);
});

// 🛑 Graceful shutdown
const gracefulShutdown = () => {
    console.log('\n👋 Zamykanie Wedding Photos...');
    
    logActivity('SERVER_STOPPING', 'Graceful shutdown initiated');
    
    // Daj czas na zakończenie aktualnych requestów
    setTimeout(() => {
        console.log('✅ Wszystkie zdjęcia pozostają bezpieczne w folderze:', config.UPLOADS_DIR);
        console.log('📋 Logi aktywności zapisane w:', config.LOG_FILE);
        
        logActivity('SERVER_STOPPED', 'Wedding Photos app stopped gracefully');
        process.exit(0);
    }, 1000);
};

// Obsługa sygnałów zamknięcia
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Obsługa nieobsłużonych błędów
process.on('uncaughtException', (error) => {
    console.error('💥 Nieobsłużony błąd:', error);
    logActivity('UNCAUGHT_EXCEPTION', error.message);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Nieobsłużone odrzucenie promise:', reason);
    logActivity('UNHANDLED_REJECTION', String(reason));
});

// Export dla ewentualnych testów
module.exports = app;