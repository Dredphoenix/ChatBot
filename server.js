require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;

    try {
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        const data = await openaiRes.json();

        if (data.choices && data.choices.length > 0) {
            const reply = data.choices[0].message.content.trim();
            res.json({ reply });
        } else {
            console.error("OpenAI returned unexpected data:", data);
            res.status(500).json({ error: "Invalid response from OpenAI." });
        }
    } catch (error) {
        console.error("Error communicating with OpenAI:", error);
        res.status(500).json({ error: "Failed to connect to OpenAI." });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
