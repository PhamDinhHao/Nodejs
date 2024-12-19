import userService from "../services/userService";
const multer = require('multer');
const upload = multer().single('faceImage');

let handleLogin = async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    if (!email || !password) {
        return res.status(500).json({
            errCode: 1,
            message: "missing input"
        })
    }
    let userData = await userService.handleUserLogin(email, password)
    return res.status(200).json({
        errCode: userData.errCode,
        message: userData.errMessage,
        user: userData.user ? userData.user : {}
    })
}
let handleGetAllUsers = async (req, res) => {
    let id = req.query.id;
    if (!id) {
        return res.status(200).json({
            errCode: 1,
            message: 'Missing required parameters',
            users
        })
    }
    let users = await userService.getAllUsers(id);
    return res.status(200).json({
        errCode: 0,
        message: 'ok',
        users
    })
}
let handleCreateNewUser = async (req, res) => {

    let message = await userService.createNewUser(req.body);

    return res.status(200).json(message);
}
let handleDeleteUser = async (req, res) => {
    if (!req.body.id) {
        return res.status(200).json({
            errCode: 1,
            message: 'Missing required parameters',
            users
        })
    }
    let message = await userService.deleteUser(req.body.id);
    return res.status(200).json(message);
}
let handleEditUser = async (req, res) => {
    let data = req.body;
    let message = await userService.updateUserData(data);
    return res.status(200).json(message);

}
let getAllCode = async (req, res) => {
    try {
        let data = await userService.getAllCodeService(req.query.type);
        return res.status(200).json(data);

    } catch (error) {
        console.log('get all code error', error)
        res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let faceRecognition = async (req, res) => {
    try {
        upload(req, res, async function(err) {
            if (err) {
                return res.status(400).json({
                    errCode: 1,
                    message: 'Error uploading file'
                });
            }
            
            const data = {
                ...req.body,
                faceImage: req.file
            };
            
            console.log("Form fields:", req.body);
            console.log("File:", req.file);
            
            let message = await userService.faceRecognition(data);
            return res.status(200).json(message);
        });
    } catch (error) {
        console.error('Face recognition error:', error);
        return res.status(500).json({
            errCode: -1,
            message: 'Server error'
        });
    }
}
let getFaceId = async (req, res) => {
    let data = req.body;
    let message = await userService.getFaceId(data);
    return res.status(200).json(message);
}
module.exports = {
    handleLogin: handleLogin,
    handleGetAllUsers: handleGetAllUsers,
    handleCreateNewUser: handleCreateNewUser,
    handleEditUser: handleEditUser,
    handleDeleteUser: handleDeleteUser,
    getAllCode: getAllCode,
    faceRecognition: faceRecognition,
    getFaceId: getFaceId,
}