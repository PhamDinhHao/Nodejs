import { request } from "express";
import db from "../models/index";
import bcrypt from 'bcryptjs';
const salt = bcrypt.genSaltSync(10);
let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};
            let isExist = await checkUserEmail(email);
            if (isExist) {
                let user = await db.User.findOne({
                    attributes: ['id','email', 'roleId', 'password', 'firstName', 'lastName'],
                    where: { email: email },
                    raw: true,

                });
                if (user) {
                    let check = bcrypt.compareSync(password, user.password);
                    if (check) {
                        userData.errCode = 0;
                        userData.errMessage = `Ok`;
                        delete user.password;
                        userData.user = user;
                    }
                    else {
                        userData.errCode = 3;
                        userData.errMessage = `Wrong password`;
                    }
                }
                else {
                    userData.errCode = 2;
                    userData.errMessage = `User's not found`;
                }

            }
            else {
                userData.errCode = 1;
                userData.errMessage = `Your's Email isn't exist in your system. Plz try other email`;

            }
            resolve(userData);
        } catch (error) {
            reject(error);
        }
    })
}


let checkUserEmail = (userEmail) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: { email: userEmail },

            })
            if (user) {
                resolve(true)
            }
            else {
                resolve(false)
            }
        } catch (error) {
            reject(error);
        }
    })
}
let compareUserPassword = () => {
    return new Promise((resolve, reject) => {
        try {

        } catch (error) {
            reject(error)
        }
    })
}
let getAllUsers = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = '';
            if (userId === 'ALL') {
                users = db.User.findAll({
                    attributes: {
                        exclude: ['password']
                    }
                })
            }
            if (userId && userId != 'ALL') {
                users = db.User.findOne({
                    where: { id: userId },
                    attributes: {
                        exclude: ['password']
                    }
                })
            }
            resolve(users)
        } catch (error) {
            reject(error)
        }
    })
}

let createNewUser = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let check = await checkUserEmail(data.email);
            if (check === true) {
                resolve({
                    errCode: 1,
                    errMessage: 'Your email is already in used, plz try another emnail'
                });
            }
            else {
                let hashPasswordFromBrypt = await hashUserPassword(data.password);
                await db.User.create({
                    email: data.email,
                    password: hashPasswordFromBrypt,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    address: data.address,
                    phonenumber: data.phonenumber,
                    gender: data.gender,
                    roleId: data.roleId,
                    positionId: data.positionId,
                    image: data.avatar

                })
                resolve({
                    errCode: 0,
                    errMessage: 'oke'
                });
            }

        } catch (error) {
            reject(error)
        }
    })
}
let hashUserPassword = (password) => {
    return new Promise(async (resolve, reject) => {
        try {
            var hashPassword = await bcrypt.hashSync(password, salt);
            resolve(hashPassword);
        } catch (error) {
            reject(error);
        }



    })
}
let deleteUser = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: { id: userId },
                raw: false

            })
            if (!user) {
                resolve({
                    errCode: 2,
                    errMessage: `The User isn't exist`
                });

            }
            else {
                await user.destroy();

                // await db.User.destroy({
                //     where: { id: userId },
                // })


                resolve({
                    errCode: 0,
                    errMessage: `The User is delete`
                });
            }

        } catch (error) {
            reject(error);
        }
    })
}
let updateUserData = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.id || !data.roleId || !data.positionId || !data.gender) {
                resolve({
                    errCode: 2,
                    errMessage: "missing requier parameter"
                })
            }
            let user = await db.User.findOne({
                where: { id: data.id },
                raw: false
            })

            if (user) {
                user.firstName = data.firstName;
                user.lastName = data.lastName;
                user.address = data.address;
                user.roleId = data.roleId;
                user.positionId = data.positionId;
                user.gender = data.gender;
                user.phonenumber = data.phonenumber;
                if (data.avatar) {
                    user.image = data.avatar;
                }

                await user.save();

                resolve({
                    errCode: 0,
                    errMessage: 'Update the user succeeds'
                });
            }
            else {
                resolve({
                    errCode: 1,
                    errMessage: 'User not found'
                });
            }
        } catch (error) {
            reject(error)
        }
    })
}
let getAllCodeService = (typeInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!typeInput) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters!'
                })
            } else {
                let res = {};
                let allcode = await db.Allcode.findAll({
                    where: { type: typeInput }
                });
                res.errCode = 0;
                res.data = allcode;
                resolve(res);
            }

        } catch (error) {
            reject(error)
        }
    })
}
let faceRecognition = (data) => {
    
    return new Promise(async (resolve, reject) => {
        try {
            // Tìm user dựa trên id
            let user = await db.User.findOne({
                where: { id: data.id },
                raw: false
            });

            if (!user) {
                resolve({
                    errCode: 1,
                    errMessage: 'Không tìm thấy người dùng'
                });
                return;
            }

            // Lưu dữ liệu khuôn mặt
            user.faceId = data.faceImage;
            await user.save();

            resolve({
                errCode: 0,
                errMessage: 'Đăng ký FaceID thành công'
            });

        } catch (error) {
            reject(error);
        }
    });
}
let getFaceId = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Kiểm tra dữ liệu đầu vào
            if (!data || !data.firstName || !data.lastName || !data.roleId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Thiếu thông tin đầu vào'
                });
                return;
            }

            // Tìm user dựa trên firstName, lastName và roleId
            let user = await db.User.findOne({
                where: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    roleId: data.roleId
                },
                raw: false
            });

            if (!user) {
                resolve({
                    errCode: 1,
                    errMessage: 'Không tìm thấy người dùng'
                });
                return;
            }

            // Kiểm tra xem user có FaceID được kích hoạt không
            if (!user.faceId) {
                resolve({
                    errCode: 2,
                    errMessage: 'FaceID chưa được kích hoạt cho người dùng này'
                });
                return;
            }

            // TODO: Thêm logic so sánh faceImage với dữ liệu khuôn mặt đã lưu
            // Giả sử có hàm compareFaces để so sánh
            // const isMatch = await compareFaces(data.faceImage, user.faceImage);

            // Tạm thời return thành công
            resolve({
                errCode: 0,
                errMessage: 'Xác thực thành công',
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roleId: user.roleId
                }
            });

        } catch (error) {
            console.log('Error:', error);
            resolve({
                errCode: -1,
                errMessage: 'Lỗi từ server'
            });
        }
    });
}
module.exports = {
    handleUserLogin: handleUserLogin,
    getAllUsers: getAllUsers,
    createNewUser: createNewUser,
    deleteUser: deleteUser,
    updateUserData: updateUserData,
    getAllCodeService: getAllCodeService,
    faceRecognition: faceRecognition,
    getFaceId: getFaceId
}