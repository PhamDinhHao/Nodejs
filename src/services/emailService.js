require('dotenv').config()
import nodemailer from 'nodemailer'

let sendSimpleEmail = async (dataSend) => {
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS,
        },
    })
    let info = await transporter.sendMail({
        from: process.env.EMAIL,
        to: dataSend.receiverEmail,
        subject: "Thông tin đặt lịch khám bệnh",
        html: `<h3>Xin chào ${dataSend.patientName}</h3>
        <p>Bạn đã đặt lịch khám bệnh với thông tin như sau:</p>
        <p>Thời gian: ${dataSend.time}</p>
        <p>Bác sĩ: ${dataSend.doctorName}</p>
        <p>Nếu thông tin tên là đúng, vui lòng vào link sau để xác nhận và điều chỉnh thông tin: <a href="${dataSend.redirectLink}" target="_blank">Click here</a></p>
        <p>Trân trọng.</p>
        `
    })
}

export default {
    sendSimpleEmail: sendSimpleEmail
}

