const crypto = require('crypto');
const querystring = require('querystring');
const moment = require('moment');
const vnpayConfig = require('../config/vnpay');
const { sortObject } = require('../util/pay');

class PaymentController {
    // Tạo URL thanh toán
    async createPaymentUrl(req, res) {
        try {
            const { amount, orderInfo, bankCode = 'NCB' } = req.body;
            
            // Kiểm tra orderInfo
            if (!orderInfo || typeof orderInfo !== 'string') {
                return res.status(400).json({
                    status: 'error',
                    message: 'orderInfo is required and must be a string'
                });
            }

            // Chuyển đổi và làm sạch amount
            const numericAmount = Math.round(Number(amount));
            
            if (isNaN(numericAmount) || numericAmount <= 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid amount. Amount must be a positive number'
                });
            }

            // Kiểm tra bankCode
            if (bankCode && typeof bankCode !== 'string') {
                return res.status(400).json({
                    status: 'error',
                    message: 'bankCode must be a string'
                });
            }

            const { vnp_TmnCode, vnp_HashSecret, vnp_ReturnUrl, vnp_Url } = vnpayConfig;
            const createDate = moment().format('YYYYMMDDHHmmss');
            const orderId = moment().format('HHmmss');
    
            const vnp_Params = {
                vnp_Version: '2.1.0',
                vnp_Command: 'pay',
                vnp_TmnCode,
                vnp_Locale: 'vn',
                vnp_CurrCode: 'VND',
                vnp_TxnRef: orderId,
                vnp_OrderInfo: orderInfo.trim(),
                vnp_OrderType: 'other',
                vnp_Amount: numericAmount * 100,
                vnp_ReturnUrl,
                vnp_IpAddr: req.ip || '127.0.0.1',
                vnp_CreateDate: createDate,
                vnp_BankCode: bankCode
            };
    
            // Sắp xếp các tham số theo thứ tự a-z
            const sortedParams = sortObject(vnp_Params);
            
            // Tạo chuỗi query parameters
            const queryString = Object.entries(sortedParams)
                .map(([key, value]) => `${key}=${value}`)
                .join('&');
            
            // Tạo chữ ký
            const hmac = crypto.createHmac("sha512", vnp_HashSecret);
            const signed = hmac.update(new Buffer.from(queryString, 'utf-8')).digest("hex");
            
            // Tạo URL thanh toán
            const paymentUrl = `${vnp_Url}?${queryString}&vnp_SecureHash=${signed}`;
            
            return res.status(200).json({ status: 'success', paymentUrl });
    
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
            const sortedParams = PaymentController.sortObject(vnpParams);

            // Tạo chuỗi ký tự cần kiểm tra
            const signData = querystring.stringify(sortedParams, { encode: false });

            // Tạo chữ ký để kiểm tra
            const hmac = crypto.createHmac('sha512', Buffer.from(vnpayConfig.vnp_HashSecret, 'utf-8'))
                .update(Buffer.from(signData, 'utf-8'))
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
}

module.exports = new PaymentController();
