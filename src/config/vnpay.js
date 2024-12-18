require('dotenv').config();

const vnpayConfig = {
    vnp_TmnCode: "CD3C9M4R",
    vnp_HashSecret: "IARSCI2PH2UMQ0FG4H9DE9CZIXC05H3Z",
    vnp_Url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnp_ReturnUrl: "http://localhost:3000/payment-result",
    vnp_Api: "https://sandbox.vnpayment.vn/merchant_webapi/api/merchant.html"
};

module.exports = vnpayConfig;
