const crypto = require('crypto');
const querystring = require('querystring');
const moment = require('moment');
const vnpayConfig = require('../config/vnpay');
const { sortObject } = require('../util/pay');

class PaymentController {
    async createPaymentUrl(req, res) {
        try {
            const { amount, orderInfo, bankCode, returnUrl } = req.body;
            console.log(bankCode);
            if (!orderInfo || typeof orderInfo !== 'string') {
                return res.status(400).json({
                    status: 'error',
                    message: 'orderInfo is required and must be a string'
                });
            }

            const numericAmount = Math.round(Number(amount));
            
            if (isNaN(numericAmount) || numericAmount <= 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Invalid amount. Amount must be a positive number'
                });
            }

            if (bankCode && typeof bankCode !== 'string') {
                return res.status(400).json({
                    status: 'error',
                    message: 'bankCode must be a string'
                });
            }

            const { vnp_TmnCode, vnp_HashSecret, vnp_Url } = vnpayConfig;
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
                vnp_ReturnUrl: returnUrl,
                vnp_IpAddr: req.ip || '127.0.0.1',
                vnp_CreateDate: createDate,
                vnp_BankCode: bankCode
            };
    
            const sortedParams = sortObject(vnp_Params);
            
            const queryString = Object.entries(sortedParams)
                .map(([key, value]) => `${key}=${value}`)
                .join('&');
            
            const hmac = crypto.createHmac("sha512", vnp_HashSecret);
            const signed = hmac.update(new Buffer.from(queryString, 'utf-8')).digest("hex");
            
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
    

    async vnpayReturn(req, res) {
        try {
            const vnpParams = req.query;
            const secureHash = vnpParams['vnp_SecureHash'];
            delete vnpParams['vnp_SecureHash'];

            const sortedParams = sortObject(vnpParams);

            const queryString = Object.entries(sortedParams)
                .map(([key, value]) => `${key}=${value}`)
                .join('&');

            const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret)
                .update(Buffer.from(queryString, 'utf-8'))
                .digest('hex');

            if (secureHash === hmac) {
                const orderId = vnpParams['vnp_TxnRef'];
                const rspCode = vnpParams['vnp_ResponseCode'];
                
                const responseData = {
                    transactionId: vnpParams['vnp_TransactionNo'],
                    orderId: orderId,
                    amount: parseInt(vnpParams['vnp_Amount']) / 100,
                    orderInfo: vnpParams['vnp_OrderInfo'],
                    bankCode: vnpParams['vnp_BankCode'],
                    bankTranNo: vnpParams['vnp_BankTranNo'],
                    cardType: vnpParams['vnp_CardType'],
                    payDate: vnpParams['vnp_PayDate'],
                    transactionStatus: rspCode,
                    responseCode: rspCode
                };

                if (rspCode === '00') {
                    return res.status(200).json({
                        status: 'success',
                        code: rspCode,
                        message: 'Thanh toán thành công',
                        data: responseData
                    });
                } else {
                    let errorMessage;
                    switch (rspCode) {
                        case '07':
                            errorMessage = 'Trừ tiền thành công. Giao dịch bị nghi ngờ';
                            break;
                        case '09':
                            errorMessage = 'Giao dịch không thành công do: Thẻ/Tài khoản không đủ số dư';
                            break;
                        case '10':
                            errorMessage = 'Giao dịch không thành công do: Khách hàng xác thực thông tin không đúng';
                            break;
                        case '11':
                            errorMessage = 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán';
                            break;
                        case '12':
                            errorMessage = 'Giao dịch không thành công do: Thẻ/Tài khoản bị khóa';
                            break;
                        case '24':
                            errorMessage = 'Giao dịch không thành công do: Khách hàng hủy giao dịch';
                            break;
                        default:
                            errorMessage = 'Giao dịch thất bại';
                    }

                    return res.status(200).json({
                        status: 'error',
                        code: rspCode,
                        message: errorMessage,
                        data: responseData
                    });
                }
            } else {
                return res.status(400).json({
                    status: 'error',
                    code: '97',
                    message: 'Chữ ký không hợp lệ',
                    data: null
                });
            }
        } catch (error) {
            console.error('VNPay Return Error:', error);
            return res.status(500).json({
                status: 'error',
                code: '99',
                message: 'Lỗi server',
                data: null
            });
        }
    }

}

module.exports = new PaymentController();
