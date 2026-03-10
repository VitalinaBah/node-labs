const config = {
    PORT: process.env.PORT ? parseInt(process.env.PORT) : null,
    HOSTNAME: process.env.HOSTNAME || 'localhost',
    NODE_ENV: process.env.NODE_ENV || 'development'
};

// Валідація згідно з пунктом 3 завдання
if (!process.env.PORT || isNaN(config.PORT)) {
    console.error("Критична помилка: PORT не вказано або він некоректний.");
    process.exit(1);
}

if (!['development', 'production'].includes(config.NODE_ENV)) {
    console.error("Критична помилка: NODE_ENV має бути 'development' або 'production'.");
    process.exit(1);
}

module.exports = config;