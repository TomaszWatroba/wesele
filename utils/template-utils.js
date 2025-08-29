// utils/template-utils.js - Template rendering utilities
const fs = require('fs');
const path = require('path');
const { logActivity, logError } = require('./logging');

// Template rendering function
const renderTemplate = (templateName, variables = {}) => {
    try {
        const templatePath = path.join(__dirname, '../views', `${templateName}.html`);
        
        if (!fs.existsSync(templatePath)) {
            logActivity('WARN', `Template not found: ${templateName}.html`);
            return generateErrorPage('Template Error', `Template ${templateName}.html not found`);
        }
        
        let template = fs.readFileSync(templatePath, 'utf8');
        
        // Replace template variables
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, variables[key] || '');
        });
        
        return template;
    } catch (error) {
        logError(error, `Failed to render template: ${templateName}`);
        return generateErrorPage('Template Error', `Failed to load ${templateName}.html`);
    }
};

// Generate a simple error page
const generateErrorPage = (title, message) => {
    return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
                color: white;
                text-align: center;
            }
            .error-box {
                background: rgba(255,255,255,0.1);
                padding: 50px;
                border-radius: 20px;
                backdrop-filter: blur(10px);
            }
            h1 { font-size: 2.5rem; margin-bottom: 20px; }
            p { font-size: 1.2rem; margin-bottom: 30px; }
            a { 
                color: #feca57; 
                text-decoration: none; 
                background: rgba(254,202,87,0.2);
                padding: 15px 30px;
                border-radius: 25px;
                display: inline-block;
                transition: all 0.3s ease;
            }
            a:hover { 
                background: rgba(254,202,87,0.3); 
                transform: translateY(-2px); 
            }
        </style>
    </head>
    <body>
        <div class="error-box">
            <h1>${title}</h1>
            <p>${message}</p>
            <a href="/">🏠 Powrót do strony głównej</a>
        </div>
    </body>
    </html>
    `;
};

// Generate menu sections HTML
const generateMenuSections = (menuItems) => {
    return menuItems.map(section => `
        <div class="menu-section">
            <h2 class="section-title">${section.category}</h2>
            ${section.items.map(item => `
                <div class="menu-item">
                    <div class="item-name">${item}</div>
                </div>
            `).join('')}
        </div>
    `).join('');
};

// Generate drinks sections HTML
const generateDrinksSections = (drinksItems) => {
    return drinksItems.map(section => `
        <div class="drinks-section">
            <h2 class="section-title">${section.category}</h2>
            <div class="drinks-items">
                ${section.items.map(item => `
                    <div class="drink-item">${item}</div>
                `).join('')}
            </div>
        </div>
    `).join('');
};

// Generate timeline items HTML
const generateTimelineItems = (timelineItems) => {
    return timelineItems.map(item => `
        <div class="timeline-item">
            <div class="timeline-time">
                <span class="timeline-icon">${item.icon}</span>
                <span>${item.time}</span>
            </div>
            <h3 class="timeline-title">${item.event}</h3>
            <p class="timeline-description">${item.description || ''}</p>
            <div class="timeline-location">
                <span class="location-icon">📍</span>
                <span>${item.location}</span>
            </div>
        </div>
    `).join('');
};

module.exports = {
    renderTemplate,
    generateErrorPage,
    generateMenuSections,
    generateDrinksSections,
    generateTimelineItems
};