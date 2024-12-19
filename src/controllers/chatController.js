const geminiConfig = require("../config/gemini");
const doctorService = require("../services/doctorService");
const db = require("../models");
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
  let doctorContext = '';

  // Xử lý các câu chào hỏi cơ bản
  if (message.includes("hi") || message.includes("hello")) {
    reply = "Chào bạn! Bạn cần hỗ trợ gì?";
    return res.json({ reply });
  } else if (message.includes("bye")) {
    reply = "Tạm biệt! Hẹn gặp lại.";
    return res.json({ reply });
  }

  try {
    // Chỉ tìm bác sĩ khi người dùng yêu cầu
    if (message.toLowerCase().includes("tìm bác sĩ")) {
      const allDoctors = await db.Doctor_Infor.findAll({
        raw: true,
        nest: true,
        include: [
          {
            model: db.User,
            attributes: ['firstName', 'lastName'],
          },
          {
            model: db.Allcode,
            as: 'specialtyData',
            attributes: ['valueVi', 'valueEn']
          },
          {
            model: db.Allcode,
            as: 'clinicData',
            attributes: ['valueVi', 'valueEn']
          },
          {
            model: db.Allcode,
            as: 'priceTypeData',
            attributes: ['valueVi', 'valueEn']
          },
          {
            model: db.Allcode,
            as: 'provinceTypeData',
            attributes: ['valueVi', 'valueEn']
          },
          {
            model: db.Allcode,
            as: 'paymentTypeData',
            attributes: ['valueVi', 'valueEn']
          },
        ]
      });
      console.log(allDoctors)
      doctorContext = allDoctors.map(doctor => `
        Bác sĩ: ${doctor.User?.firstName} ${doctor.User?.lastName}
        Chuyên khoa: ${doctor.specialtyData?.valueVi || 'Chưa cập nhật'}
        Phòng khám: ${doctor.clinicData?.valueVi || 'Chưa cập nhật'}
        Địa chỉ: ${doctor.addressClinic}
        Giá khám: ${doctor.priceTypeData?.valueVi || 'Chưa cập nhật'}
        Tỉnh/Thành phố: ${doctor.provinceTypeData?.valueVi || 'Chưa cập nhật'}
        Phương thức thanh toán: ${doctor.paymentTypeData?.valueVi || 'Chưa cập nhật'}
      `).join('\n');
    }

    // Tạo prompt dựa trên context
    const promptWithContext = message.toLowerCase().includes("tìm bác sĩ") 
      ? `
        Thông tin về các bác sĩ:
        ${doctorContext}
        
        Câu hỏi của người dùng: ${message}
        
        Hãy trả lời câu hỏi trên dựa vào thông tin các bác sĩ được cung cấp. Và hãy đưa ra các bác sĩ phù hợp với yêu cầu của người dùng. Và sinh ra nút để chuyển hướng sang google map để người dùng có thể xem địa chỉ của bác sĩ.`
      : message;

    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });
    
    const result = await chatSession.sendMessage(promptWithContext);
    const response = await result.response;
    reply = response.candidates[0].content.parts[0].text;
    
    return res.json({ reply });
  } catch (error) {
    console.error(error);
    res.json({ reply: "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn." });
  }
};

module.exports = {
  postChat: postChat,
};

