require('dotenv').config();
const { OpenAI } = require('openai');

async function testKey() {
    console.log('🔑 Testing OpenAI Key...');
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
        console.error('❌ No OPENAI_API_KEY found in .env');
        process.exit(1);
    }
    console.log(`📡 Key length: ${key.length}`);
    console.log(`📡 Key prefix: ${key.substring(0, 10)}...`);

    try {
        const openai = new OpenAI({ apiKey: key });
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 5
        });
        console.log('✅ OpenAI Connection Successful!');
        console.log('🤖 Response:', response.choices[0].message.content);
    } catch (error) {
        console.error('❌ OpenAI Error:', error.message);
        if (error.status === 401) console.error('💡 Tip: Your API key is invalid.');
        if (error.status === 429) console.error('💡 Tip: You have run out of credits or reached a rate limit!');
    }
}

testKey();
