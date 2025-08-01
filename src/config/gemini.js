require('dotenv').config();

const geminiConfig = {
    GEMINI_API_KEY : "AIzaSyCHR42K7Lt36-2IPg4OAX-Szt58EYcHWSU",
    GEMINI_ENDPOINT : "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
};

module.exports = geminiConfig;
