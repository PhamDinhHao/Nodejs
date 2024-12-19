require('dotenv').config();

const geminiConfig = {
    GEMINI_API_KEY : "AIzaSyCK8ZiMcq9hvG_hoBg9g_v_SjChI41S-Jo",
    GEMINI_ENDPOINT : "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
};

module.exports = geminiConfig;
