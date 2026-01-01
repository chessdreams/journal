const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const configPath = path.join(__dirname, 'config.js');

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });

    const configContent = `const CONFIG = {
    SUPABASE_URL: '${env.SUPABASE_URL || ''}',
    SUPABASE_ANON_KEY: '${env.SUPABASE_ANON_KEY || ''}'
};`;

    fs.writeFileSync(configPath, configContent);
    console.log('✅ config.js generated from .env successfully.');
} catch (error) {
    if (error.code === 'ENOENT') {
        console.error('❌ .env file not found. Please create one with SUPABASE_URL and SUPABASE_ANON_KEY.');
    } else {
        console.error('❌ Error generating config.js:', error);
    }
}
