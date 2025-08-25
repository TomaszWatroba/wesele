#!/usr/bin/env node

// setup-templates.js - Create all HTML template files
const fs = require('fs');
const path = require('path');

console.log('🏗️  Setting up HTML template files...');

// Create views directory
const viewsDir = path.join(__dirname, 'views');
if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
    console.log('✅ Created views/ directory');
}

// Template files with their content
const templates = {
    'menu.html': `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PAGE_TITLE}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            min-height: 100vh; color: #333; padding: 20px;
        }
        .container {
            max-width: 800px; margin: 0 auto; background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(15px); border-radius: 25px; padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { text-align: center; margin-bottom: 40px; }
        .back-link {
            color: #666; text-decoration: none; font-size: 0.9rem;
            margin-bottom: 20px; display: inline-block; transition: color 0.3s ease;
        }
        .back-link:hover { color: #d63384; }
        .title {
            font-size: 2.5rem; font-weight: 300; color: #d63384; margin-bottom: 10px;
        }
        .subtitle { font-size: 1.1rem; color: #666; margin-bottom: 20px; }
        .menu-section {
            margin-bottom: 40px; background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
            border-radius: 20px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }
        .section-title {
            font-size: 1.8rem; color: #d63384; margin-bottom: 20px; text-align: center; position: relative;
        }
        .section-title::after {
            content: ''; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%);
            width: 60px; height: 3px; background: linear-gradient(90deg, #d63384, #fcb69f); border-radius: 2px;
        }
        .menu-item {
            background: rgba(255,255,255,0.8); border-radius: 15px; padding: 20px; margin: 15px 0;
            border-left: 4px solid #d63384; transition: all 0.3s ease;
        }
        .menu-item:hover { transform: translateX(5px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
        .item-name { font-size: 1.2rem; font-weight: 600; color: #333; margin-bottom: 8px; }
        .dietary-info {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 15px;
            padding: 20px; margin-top: 30px; border: 1px solid #90caf9;
        }
        .dietary-title { font-size: 1.3rem; color: #1565c0; margin-bottom: 15px; text-align: center; }
        .dietary-item {
            margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.7);
            border-radius: 10px; font-size: 0.9rem;
        }
        @media (max-width: 768px) {
            .container { margin: 10px; padding: 20px; }
            .title { font-size: 2rem; }
            .menu-section { padding: 20px; margin-bottom: 25px; }
            .section-title { font-size: 1.5rem; }
            .menu-item { padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Powrót do strony głównej</a>
            <h1 class="title">🍽️ Menu</h1>
            <p class="subtitle">Smakowite dania przygotowane z miłością</p>
        </div>
        {{MENU_SECTIONS}}
        <div class="dietary-info">
            <h3 class="dietary-title">🌱 Informacje dietetyczne</h3>
            <div class="dietary-item"><strong>Opcje wegetariańskie:</strong> Dostępne na życzenie</div>
            <div class="dietary-item"><strong>Alergie:</strong> Prosimy o wcześniejsze zgłoszenie</div>
            <div class="dietary-item"><strong>Dania bezglutenowe:</strong> Możliwe do przygotowania</div>
        </div>
    </div>
</body>
</html>`,

    'drinks.html': `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PAGE_TITLE}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; color: white; padding: 20px;
        }
        .container {
            max-width: 800px; margin: 0 auto; background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px); border-radius: 25px; padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .header { text-align: center; margin-bottom: 40px; }
        .back-link {
            color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.9rem;
            margin-bottom: 20px; display: inline-block; transition: color 0.3s ease;
        }
        .back-link:hover { color: white; }
        .title { font-size: 2.5rem; font-weight: 300; margin-bottom: 10px; }
        .subtitle { font-size: 1.1rem; opacity: 0.9; }
        .drinks-section {
            margin-bottom: 40px; background: rgba(255, 255, 255, 0.1);
            border-radius: 20px; padding: 30px; backdrop-filter: blur(10px);
        }
        .section-title {
            font-size: 1.8rem; margin-bottom: 25px; text-align: center; position: relative;
        }
        .section-title::after {
            content: ''; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%);
            width: 60px; height: 3px; background: linear-gradient(90deg, #ff9a9e, #fecfef); border-radius: 2px;
        }
        .drink-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;
        }
        .drink-card {
            background: rgba(255, 255, 255, 0.15); border-radius: 15px; padding: 20px;
            text-align: center; transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.2);
        }
        .drink-card:hover { transform: translateY(-5px); background: rgba(255, 255, 255, 0.2); }
        .drink-icon { font-size: 3rem; margin-bottom: 15px; display: block; }
        .drink-name { font-size: 1.3rem; font-weight: 600; margin-bottom: 10px; }
        .signature-drinks { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #333; }
        .signature-drinks .drink-card { background: rgba(255, 255, 255, 0.9); color: #333; }
        .bar-info {
            background: rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 25px;
            margin-top: 30px; text-align: center;
        }
        .bar-hours { font-size: 1.2rem; margin-bottom: 15px; }
        .bar-note { font-size: 0.95rem; opacity: 0.8; }
        @media (max-width: 768px) {
            .container { margin: 10px; padding: 20px; }
            .title { font-size: 2rem; }
            .drinks-section { padding: 20px; margin-bottom: 25px; }
            .drink-grid { grid-template-columns: 1fr; gap: 15px; }
            .drink-card { padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Powrót do strony głównej</a>
            <h1 class="title">🍸 Napoje</h1>
            <p class="subtitle">Koktajle, wina i specjalne mieszanki na nasz wyjątkowy dzień</p>
        </div>
        <div class="drinks-section signature-drinks">
            <h2 class="section-title">✨ Koktajle firmowe</h2>
            <div class="drink-grid">
                <div class="drink-card">
                    <span class="drink-icon">🍹</span>
                    <h3 class="drink-name">{{BRIDE_NAME}} & {{GROOM_NAME}} Spritz</h3>
                    <p>Nasz autorski koktajl z Prosecco, Aperol i nutą pomarańczy</p>
                </div>
                <div class="drink-card">
                    <span class="drink-icon">🌅</span>
                    <h3 class="drink-name">Sunset Love</h3>
                    <p>Romantyczny drink z wódką, sokiem żurawinowym i limonką</p>
                </div>
            </div>
        </div>
        {{DRINKS_SECTIONS}}
        <div class="bar-info">
            <div class="bar-hours">🕐 Bar czynny: 18:00 - 02:00</div>
            <div class="bar-note">Nasi barmani z przyjemnością przygotują dla Państwa dowolny drink na życzenie!</div>
        </div>
    </div>
</body>
</html>`,

    'seating.html': `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PAGE_TITLE}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            min-height: 100vh; color: #333; padding: 20px;
        }
        .container {
            max-width: 900px; margin: 0 auto; background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(15px); border-radius: 25px; padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .header { text-align: center; margin-bottom: 40px; }
        .back-link {
            color: #666; text-decoration: none; font-size: 0.9rem;
            margin-bottom: 20px; display: inline-block; transition: color 0.3s ease;
        }
        .back-link:hover { color: #d63384; }
        .title { font-size: 2.5rem; font-weight: 300; color: #d63384; margin-bottom: 10px; }
        .subtitle { font-size: 1.1rem; color: #666; }
        .search-section {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 20px; padding: 25px; margin-bottom: 30px; text-align: center;
        }
        .search-input {
            width: 100%; max-width: 400px; padding: 15px 20px; border: 2px solid #dee2e6;
            border-radius: 50px; font-size: 1rem; background: white; transition: all 0.3s ease;
        }
        .search-input:focus {
            outline: none; border-color: #d63384; box-shadow: 0 0 0 3px rgba(214, 51, 132, 0.1);
        }
        .seating-layout {
            background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
            border-radius: 20px; padding: 30px; margin-bottom: 30px;
        }
        .layout-title { font-size: 1.5rem; color: #d63384; text-align: center; margin-bottom: 25px; }
        .tables-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px; margin-bottom: 30px;
        }
        .table {
            background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); border: 2px solid #dee2e6;
            border-radius: 15px; padding: 20px; text-align: center; transition: all 0.3s ease; position: relative;
        }
        .table:hover {
            transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-color: #d63384;
        }
        .table-number { font-size: 2rem; color: #d63384; font-weight: 700; margin-bottom: 10px; }
        .table-guests { font-size: 0.9rem; color: #666; }
        .guest-name { display: block; padding: 3px 0; transition: color 0.3s ease; }
        .guest-name.highlighted { color: #d63384; font-weight: 600; }
        .head-table {
            grid-column: 1 / -1; background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            border-color: #d63384;
        }
        .head-table .table-number { color: #d63384; }
        .venue-info {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 15px;
            padding: 20px; text-align: center; border: 1px solid #90caf9;
        }
        .venue-title { font-size: 1.3rem; color: #1565c0; margin-bottom: 15px; }
        .venue-details { color: #1976d2; line-height: 1.6; }
        @media (max-width: 768px) {
            .container { margin: 10px; padding: 20px; }
            .title { font-size: 2rem; }
            .tables-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
            .table { padding: 15px; }
            .table-number { font-size: 1.5rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Powrót do strony głównej</a>
            <h1 class="title">🪑 Plan miejsc</h1>
            <p class="subtitle">Znajdź swoje miejsce przy stole</p>
        </div>
        <div class="search-section">
            <input type="text" id="guestSearch" class="search-input" placeholder="Wpisz swoje imię i nazwisko...">
        </div>
        <div class="seating-layout">
            <h2 class="layout-title">Rozmieszczenie stołów</h2>
            <div class="tables-grid">
                <div class="table head-table">
                    <div class="table-number">👰🤵</div>
                    <div class="table-guests">
                        <span class="guest-name">Stół Młodej Pary</span>
                        <span class="guest-name">{{BRIDE_NAME}} & {{GROOM_NAME}}</span>
                        <span class="guest-name">Świadkowie</span>
                        <span class="guest-name">Rodzice</span>
                    </div>
                </div>
                <div class="table">
                    <div class="table-number">1</div>
                    <div class="table-guests">
                        <span class="guest-name">Anna Kowalska</span>
                        <span class="guest-name">Jan Kowalski</span>
                        <span class="guest-name">Maria Nowak</span>
                        <span class="guest-name">Piotr Nowak</span>
                    </div>
                </div>
                <div class="table">
                    <div class="table-number">2</div>
                    <div class="table-guests">
                        <span class="guest-name">Magdalena Lewandowska</span>
                        <span class="guest-name">Robert Lewandowski</span>
                        <span class="guest-name">Katarzyna Wójcik</span>
                        <span class="guest-name">Michał Wójcik</span>
                    </div>
                </div>
                <div class="table">
                    <div class="table-number">3</div>
                    <div class="table-guests">
                        <span class="guest-name">Joanna Kamińska</span>
                        <span class="guest-name">Paweł Kamiński</span>
                        <span class="guest-name">Monika Zielińska</span>
                        <span class="guest-name">Marcin Zieliński</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="venue-info">
            <h3 class="venue-title">📍 Informacje o lokalu</h3>
            <div class="venue-details">
                <strong>{{VENUE_NAME}}</strong><br>
                Sala weselna - I piętro<br>
                Recepcja rozpoczyna się o 16:00<br>
                Kolacja o 18:00
            </div>
        </div>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('guestSearch');
            const guestNames = document.querySelectorAll('.guest-name');
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase().trim();
                guestNames.forEach(nameElement => {
                    const name = nameElement.textContent.toLowerCase();
                    if (searchTerm && name.includes(searchTerm)) {
                        nameElement.classList.add('highlighted');
                        nameElement.closest('.table').style.order = '-1';
                        nameElement.closest('.table').style.transform = 'scale(1.05)';
                    } else {
                        nameElement.classList.remove('highlighted');
                        nameElement.closest('.table').style.order = '';
                        nameElement.closest('.table').style.transform = '';
                    }
                });
                if (!searchTerm) {
                    guestNames.forEach(nameElement => {
                        nameElement.closest('.table').style.order = '';
                        nameElement.closest('.table').style.transform = '';
                    });
                }
            });
        });
    </script>
</body>
</html>`,

    'story.html': `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{PAGE_TITLE}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
            min-height: 100vh; color: #333;
        }
        .container { max-width: 900px; margin: 0 auto; padding: 20px; }
        .header {
            text-align: center; padding: 40px 20px; background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(15px); border-radius: 25px; margin-bottom: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .back-link {
            color: #666; text-decoration: none; font-size: 0.9rem;
            margin-bottom: 20px; display: inline-block; transition: color 0.3s ease;
        }
        .back-link:hover { color: #d63384; }
        .title { font-size: 2.5rem; font-weight: 300; color: #d63384; margin-bottom: 10px; }
        .subtitle { font-size: 1.1rem; color: #666; }
        .story-timeline { position: relative; }
        .timeline-item { display: flex; margin-bottom: 40px; position: relative; }
        .timeline-item::before {
            content: ''; position: absolute; left: 25px; top: 80px; bottom: -40px;
            width: 3px; background: linear-gradient(to bottom, #d63384, #fecfef); z-index: 1;
        }
        .timeline-item:last-child::before { display: none; }
        .timeline-dot {
            width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #d63384 0%, #fecfef 100%);
            display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-right: 30px;
            flex-shrink: 0; position: relative; z-index: 2; box-shadow: 0 8px 20px rgba(214, 51, 132, 0.3);
        }
        .timeline-content {
            flex: 1; background: rgba(255, 255, 255, 0.95); border-radius: 20px; padding: 30px;
            box-shadow: 0 15px 30px rgba(0,0,0,0.1); backdrop-filter: blur(10px); transition: all 0.3s ease;
        }
        .timeline-content:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
        .timeline-date {
            font-size: 0.9rem; color: #d63384; font-weight: 600; margin-bottom: 10px;
            text-transform: uppercase; letter-spacing: 1px;
        }
        .timeline-title { font-size: 1.5rem; color: #333; margin-bottom: 15px; font-weight: 600; }
        .timeline-description { color: #666; line-height: 1.6; font-size: 1rem; }
        .couple-photos {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 40px 0;
        }
        .photo-placeholder {
            aspect-ratio: 4/3; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px; display: flex; align-items: center; justify-content: center;
            font-size: 3rem; color: #d63384; border: 2px dashed #dee2e6; transition: all 0.3s ease;
        }
        .photo-placeholder:hover { transform: scale(1.02); border-color: #d63384; }
        .love-quote {
            background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); border-radius: 20px;
            padding: 40px; text-align: center; margin: 40px 0; box-shadow: 0 15px 30px rgba(0,0,0,0.1);
            position: relative; overflow: hidden;
        }
        .love-quote::before {
            content: '"'; position: absolute; top: -20px; left: 30px; font-size: 8rem;
            color: rgba(214, 51, 132, 0.1); font-family: serif;
        }
        .quote-text {
            font-size: 1.3rem; color: #333; font-style: italic; line-height: 1.6; position: relative; z-index: 1;
        }
        .quote-author { font-size: 1rem; color: #d63384; margin-top: 20px; font-weight: 600; }
        @media (max-width: 768px) {
            .container { padding: 15px; }
            .header { padding: 30px 20px; margin-bottom: 20px; }
            .title { font-size: 2rem; }
            .timeline-item { flex-direction: column; margin-bottom: 30px; }
            .timeline-item::before { display: none; }
            .timeline-dot { align-self: flex-start; margin-right: 0; margin-bottom: 15px; }
            .timeline-content { padding: 20px; }
            .couple-photos { grid-template-columns: 1fr; gap: 15px; }
            .love-quote { padding: 25px; }
            .quote-text { font-size: 1.1rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Powrót do strony głównej</a>
            <h1 class="title">💕 Nasza historia</h1>
            <p class="subtitle">Droga do miłości i szczęścia</p>
        </div>
        <div class="story-timeline">
            <div class="timeline-item">
                <div class="timeline-dot">👫</div>
                <div class="timeline-content">
                    <div class="timeline-date">Czerwiec 2020</div>
                    <h3 class="timeline-title">Pierwsze spotkanie</h3>
                    <p class="timeline-description">
                        To było magiczne lato. Spotkaliśmy się na wspólnych znajomych podczas grilla. 
                        Od pierwszej chwili wiedzieliśmy, że to coś więcej niż zwykła znajomość.
                    </p>
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-dot">❤️</div>
                <div class="timeline-content">
                    <div class="timeline-date">Sierpień 2020</div>
                    <h3 class="timeline-title">Pierwsza randka</h3>
                    <p class="timeline-description">
                        Oficjalna pierwsza randka w małej restauracji nad jeziorem. 
                        {{GROOM_NAME}} był tak zdenerwowany, że przewrócił kieliszek z winem!
                    </p>
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-dot">🏠</div>
                <div class="timeline-content">
                    <div class="timeline-date">Maj 2022</div>
                    <h3 class="timeline-title">Wspólne mieszkanie</h3>
                    <p class="timeline-description">
                        Po dwóch latach związku zdecydowaliśmy się zamieszkać razem. 
                        Pierwszy dzień w nowym mieszkaniu spędziliśmy na składaniu mebli z IKEA!
                    </p>
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-dot">💍</div>
                <div class="timeline-content">
                    <div class="timeline-date">Grudzień 2024</div>
                    <h3 class="timeline-title">Oświadczyny</h3>
                    <p class="timeline-description">
                        W wigilijny wieczór, przy choince, {{GROOM_NAME}} padł na kolano. 
                        {{BRIDE_NAME}} była tak zaskoczona, że przez chwilę myślała, że przewrócił się!
                    </p>
                </div>
            </div>
            <div class="timeline-item">
                <div class="timeline-dot">💒</div>
                <div class="timeline-content">
                    <div class="timeline-date">{{WEDDING_DATE_FORMATTED}}</div>
                    <h3 class="timeline-title">Nasz wielki dzień!</h3>
                    <p class="timeline-description">
                        Dziś rozpoczynamy nowy rozdział jako mąż i żona. 
                        Dziękujemy, że jesteście z nami w tym wyjątkowym dniu!
                    </p>
                </div>
            </div>
        </div>
        <div class="couple-photos">
            <div class="photo-placeholder">📸</div>
            <div class="photo-placeholder">📷</div>
            <div class="photo-placeholder">💕</div>
        </div>
        <div class="love-quote">
            <p class="quote-text">
                Miłość to nie tylko patrzenie na siebie nawzajem, to patrzenie razem w tym samym kierunku.
            </p>
            <p class="quote-author">— Antoine de Saint-Exupéry</p>
        </div>
    </div>
</body>
</html>`
};

// Create each template file
Object.entries(templates).forEach(([filename, content]) => {
    const filePath = path.join(viewsDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Created views/${filename}`);
});

console.log(`
🎉 Template setup complete!

📁 Created files:
${Object.keys(templates).map(f => `   views/${f}`).join('\n')}

🚀 Next steps:
1. Replace your server.js with the refactored version
2. Start your server: node server.js
3. Your website will be much cleaner and easier to maintain!

✨ Benefits:
- Server.js is now 90% shorter
- HTML templates are separate and editable
- Template variables for easy customization
- Much better organization
`);