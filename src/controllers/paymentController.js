// config/vnpay.js
require('dotenv').config();

export const vnpayConfig = {
    vnp_TmnCode: process.env.VNP_TMN_CODE || 'CD3C9M4R',
    vnp_HashSecret: process.env.VNP_HASH_SECRET || 'IARSCI2PH2UMQ0FG4H9DE9CZIXC05H3Z',
    vnp_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/payment-result',
    vnp_Api: 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction'
};
// controllers/paymentController.js
import crypto from 'crypto';
import querystring from 'querystring';
import moment from 'moment';

class PaymentController {
    // Tạo URL thanh toán
    async createPaymentUrl(req, res) {
        try {
            const { amount, orderInfo, bankCode = 'NCB' } = req.body;
            
            if (!amount || !orderInfo) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Missing required parameters'
                });
            }

            const vnp_Params = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode: vnpayConfig.vnp_TmnCode,
                vnp_Amount: Math.round(amount * 100),
                vnp_CurrCode: 'VND',
                vnp_TxnRef: moment().format('YYYYMMDDHHmmss'),
                vnp_OrderInfo: orderInfo,
                vnp_OrderType: 'billpayment',
                vnp_Locale: 'vn',
                vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
                vnp_IpAddr: req.headers['x-forwarded-for'] || 
                           req.connection.remoteAddress ||
                           req.socket.remoteAddress,
                vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
                vnp_BankCode: bankCode
            };

            // Sắp xếp các tham số theo thứ tự a-z
            const sortedParams = this.sortObject(vnp_Params);
            
            // Tạo chuỗi ký tự cần ký
            const signData = querystring.stringify(sortedParams, { encode: false });
            
            // Tạo chữ ký
            const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret)
                              .update(signData)
                              .digest('hex');
            
            sortedParams['vnp_SecureHash'] = hmac;

            // Tạo URL thanh toán
            const paymentUrl = `${vnpayConfig.vnp_Url}?${querystring.stringify(sortedParams, { encode: false })}`;

            return res.status(200).json({
                status: 'success',
                paymentUrl: paymentUrl
            });

        } catch (error) {
            console.error('Create Payment Error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }

    // Xử lý kết quả thanh toán từ VNPAY
    async vnpayReturn(req, res) {
        try {
            const vnpParams = req.query;
            const secureHash = vnpParams['vnp_SecureHash'];

            // Xóa các tham số không cần thiết
            delete vnpParams['vnp_SecureHash'];
            delete vnpParams['vnp_SecureHashType'];

            // Sắp xếp các tham số
            const sortedParams = this.sortObject(vnpParams);
            
            // Tạo chuỗi ký tự cần kiểm tra
            const signData = querystring.stringify(sortedParams, { encode: false });
            
            // Tạo chữ ký để kiểm tra
            const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret)
                              .update(signData)
                              .digest('hex');

            // So sánh chữ ký
            if (secureHash === hmac) {
                // Thanh toán thành công
                const orderId = vnpParams['vnp_TxnRef'];
                const rspCode = vnpParams['vnp_ResponseCode'];

                // Kiểm tra mã phản hồi
                if (rspCode === '00') {
                    // Cập nhật trạng thái đơn hàng trong database
                    return res.status(200).json({
                        status: 'success',
                        code: vnpParams['vnp_ResponseCode'],
                        message: 'Payment successful'
                    });
                } else {
                    return res.status(200).json({
                        status: 'error',
                        code: vnpParams['vnp_ResponseCode'],
                        message: 'Payment failed'
                    });
                }
            } else {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid signature'
                });
            }
        } catch (error) {
            console.error('VNPay Return Error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error'
            });
        }
    }

    // Hàm sắp xếp object theo key
    sortObject(obj) {
        return Object.keys(obj)
            .sort()
            .reduce((result, key) => {
                result[key] = obj[key];
                return result;
            }, {});
    }
}

export default new PaymentController();
