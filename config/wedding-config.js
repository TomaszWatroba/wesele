// config/wedding-config.js - Wedding-specific Configuration
module.exports = {
    // Menu configuration
    MENU_ITEMS: [
        {
            category: "Przystawki",
            items: [
                "Carpaccio z łososia z kaparami",
                "Bruschetta z pomidorami i bazylią",
                "Tartar z tuńczyka"
            ]
        },
        {
            category: "Zupy",
            items: [
                "Żurek na żeberkach",
                "Krem z dyni z grzankami"
            ]
        },
        {
            category: "Dania główne",
            items: [
                "Stek wołowy z ziemniakami grillowanymi",
                "Łosoś z warzywami sezonowymi",
                "Pierś z kaczki z sosem wiśniowym"
            ]
        },
        {
            category: "Desery",
            items: [
                "Tort weselny",
                "Tiramisu",
                "Sorbet owocowy"
            ]
        }
    ],
    
    // Drinks configuration
    DRINKS_ITEMS: [
        {
            category: "Wina białe",
            items: [
                "Chardonnay",
                "Sauvignon Blanc",
                "Riesling"
            ]
        },
        {
            category: "Wina czerwone", 
            items: [
                "Cabernet Sauvignon",
                "Merlot",
                "Pinot Noir"
            ]
        },
        {
            category: "Alkohole",
            items: [
                "Whiskey",
                "Vodka",
                "Rum",
                "Gin"
            ]
        },
        {
            category: "Napoje bezalkoholowe",
            items: [
                "Woda mineralna",
                "Soki owocowe",
                "Coca-Cola",
                "Sprite",
                "Kawa",
                "Herbata"
            ]
        }
    ],
    
    // Timeline/Schedule
    WEDDING_TIMELINE: [
        {
            time: "14:00",
            event: "Ceremonia Ślubna",
            location: "Kościół pw. Św. Marii Magdaleny",
            icon: "💒"
        },
        {
            time: "15:30",
            event: "Sesja zdjęciowa",
            location: "Przy kościele oraz w okolicznym parku",
            icon: "📸"
        },
        {
            time: "16:30",
            event: "Powitanie w restauracji",
            location: "Restauracja \"Weranda\"",
            icon: "🍞"
        },
        {
            time: "17:00",
            event: "Obiad weselny",
            location: "Sala główna restauracji",
            icon: "🍽️"
        },
        {
            time: "20:00",
            event: "Pierwszy taniec",
            location: "Parkiet taneczny",
            icon: "💃"
        },
        {
            time: "21:00",
            event: "Zabawa do białego rana",
            location: "Cała sala restauracji",
            icon: "🎉"
        }
    ],
    
    // Service Providers
    WEDDING_PROVIDERS: [
        {
            name: "DJ Remi",
            category: "music",
            role: "DJ & Oprawa muzyczna",
            avatar: "🎵",
            email: "kontakt@djremi.pl",
            instagram: "https://instagram.com/djremi.pl/",
            website: "https://www.djremi.pl/"
        },
        {
            name: "Anna Kowalska",
            category: "photo",
            role: "Fotografia ślubna",
            avatar: "📷",
            email: "info@rafalmakiela.pl",
            instagram: "https://www.instagram.com/rafalmakiela_fotografia",
            website: "https://www.rafalmakiela.pl/"
        },
        {
            name: "Barman Michał",
            category: "food",
            role: "Barman - Drinki & Koktajle",
            avatar: "🍹",
            email: "michal@cocktailbar.pl",
            instagram: "https://www.instagram.com/cocktail_makers_opole",
            website: "https://cocktaileventmakers.pl/"
        }
    ]
};