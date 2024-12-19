const geminiConfig = require("../config/gemini");
const fetch = require('node-fetch')
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const apiKey = geminiConfig.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};
let postChat = async (req, res) => {
  const { message } = req.body;
  let reply = "Xin chào! Tôi có thể giúp gì cho bạn?";
  if (message.includes("hi")) {
    reply = "Chào bạn! Bạn cần hỗ trợ gì?";
    return res.json({ reply });
  } else if (message.includes("giá")) {
    reply = "Hiện tại giá sản phẩm là 500,000 VND.";
    return res.json({ reply });
  } else if (message.includes("bye")) {
    reply = "Tạm biệt! Hẹn gặp lại.";
    return res.json({ reply });
  }
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    const result = await chatSession.sendMessage(message);
    const response = await result.response;
    reply = response.candidates[0].content.parts[0].text;
    return res.json({ reply });
  } catch (error) {
    console.error(error);
    res.json({ reply: "Error from server..." });
  }
};

module.exports = {
  postChat: postChat,
};

