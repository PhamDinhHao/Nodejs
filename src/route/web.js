import express from "express";
import homeController from "../controllers/homeControlller"
import userController from "../controllers/userController"
import doctorController from "../controllers/doctorController"
import patientController from "../controllers/patientController"
import specialtyController from "../controllers/specialtyController";
import clinicController from "../controllers/clinicController";
import crypto from 'crypto';
import querystring from 'querystring';
import paymentController from "../controllers/paymentController";
import chatController from "../controllers/chatController";
require('dotenv').config();

const config = {
    vnp_TmnCode: 'CD3C9M4R', // Mã TMN của bạn
    vnp_HashSecret: 'IARSCI2PH2UMQ0FG4H9DE9CZIXC05H3Z', // Key bí mật
    vnp_Url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', // URL VNPAY
    vnp_ReturnUrl: 'http://localhost:3000/payment-result', // URL nhận kết quả
    vnp_IpAddr: '127.0.0.1',
    vnp_Api:"https://sandbox.vnpayment.vn/merchant_webapi/api/transaction",
};
let router = express.Router();

let initWebRoutes = (app) => {

    router.get('/', homeController.getHomepage);
    router.get('/crud', homeController.getCRUD);
    router.post('/post-crud', homeController.postCRUD);
    router.get('/hao', (req, res) => {
        return res.send('Hello World ban Hao');

    });
    router.get('/get-crud', homeController.displayGetCRUD);
    router.get('/edit-crud', homeController.getEditCRUD);
    router.post('/put-crud', homeController.putCRUD);
    router.get('/delete-crud', homeController.deleteCRUD);
    router.post('/api/login', userController.handleLogin);
    router.get('/api/get-all-users', userController.handleGetAllUsers);
    router.post('/api/create-new-user', userController.handleCreateNewUser);
    router.put('/api/edit-user', userController.handleEditUser);
    router.delete('/api/delete-user', userController.handleDeleteUser);
    router.post('/api/face-recognition', userController.faceRecognition);
    router.post('/api/get-face-id', userController.getFaceId);
    router.get('/api/allcode', userController.getAllCode);

    router.get('/api/top-doctor-home', doctorController.getTopDoctorHome);
    router.get('/api/get-all-doctor', doctorController.getAllDocters);
    router.post('/api/save-infor-doctor', doctorController.postInforDoctor);
    router.get('/api/get-detail-doctor-by-id', doctorController.getDetailDoctorById);
    router.post('/api/bulk-create-schedule', doctorController.bulkCreateSchedule)
    router.get('/api/get-schedule-doctor-by-date', doctorController.getScheduleByDate);
    router.get('/api/get-list-patient-for-doctor', doctorController.getListPatientForDoctor)
    router.post('/api/send-remedy', doctorController.sendRemedy)
    router.get('/api/get-extra-infor-doctor-by-id', doctorController.getExtraInforDoctorById);
    router.get('/api/get-profile-doctor-by-id', doctorController.getProfileDoctorById);

    router.post('/api/patient-book-appointment', patientController.postBookAppointment);
    router.post('/verify-booking-appointment', patientController.verifyBookingAppointment);

    router.post('/api/create-new-specialty', specialtyController.createSpecialty);
    router.get('/api/get-all-specialty', specialtyController.getAllSpecialty);
    router.get('/api/get-detail-specialty-by-id', specialtyController.getDetailSpecialtyById);
    router.get('/api/get-all-clinic', clinicController.getAllClinic);
    router.post('/api/create-new-clinic', clinicController.createClinic);
    router.get('/api/get-detail-clinic-by-id', clinicController.getDetailClinicById);
    router.post('/api/create-payment', paymentController.createPaymentUrl);
    router.get('/api/vnpay-return', paymentController.vnpayReturn);
    router.post('/api/chat', chatController.postChat);
    return app.use("/", router);

}
module.exports = initWebRoutes;