const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const configPath = path.join(__dirname, 'config.js');

try {
    let env = {};

    // 1. Try to load from process.env (Netlify / CI)
    if (process.env.SUPABASE_URL) {
        console.log('ℹ️  Using environment variables from process.env');
        env = {
            SUPABASE_URL: process.env.SUPABASE_URL,
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
        };
    }
    // 2. Fallback to .env file (Local Dev)
    else if (fs.existsSync(envPath)) {
        console.log('ℹ️  Loading .env file...');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) env[key.trim()] = value.trim();
        });
    }

    const configContent = `const CONFIG = {
    SUPABASE_URL: '${env.SUPABASE_URL || ''}',
    SUPABASE_ANON_KEY: '${env.SUPABASE_ANON_KEY || ''}'
};`;

    fs.writeFileSync(configPath, configContent);
    console.log('✅ config.js generated successfully.');

    if (!env.SUPABASE_URL) {
        console.warn('⚠️  Warning: SUPABASE_URL was empty. Application may fail.');
    }

} catch (error) {
    console.error('❌ Error generating config.js:', error);
    process.exit(1);
}
