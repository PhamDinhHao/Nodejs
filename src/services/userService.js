// config/faceApiConfig.js
const { createCanvas, loadImage } = require('canvas');
const faceapi = require('face-api.js');
const fetch = require('node-fetch');
const path = require('path');
const { Canvas } = require('@napi-rs/canvas');
const bcrypt = require('bcrypt');
const db = require('../models');
const FileType = require('file-type');
const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-node');

// Set CPU backend
tf.setBackend('cpu');

const env = {
    Canvas: require('canvas').Canvas,
    Image: require('canvas').Image,
    ImageData: require('canvas').ImageData,
    createCanvasElement: () => {
        const canvas = createCanvas(640, 480);
        canvas.width = 640;
        canvas.height = 480;
        return canvas;
    },
    fetch
};

let modelsLoaded = false;

const initializeFaceApi = async () => {
    try {
        if (modelsLoaded) return;

        const modelPath = path.join(process.cwd(), 'public', 'models');
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
            faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
            faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)
        ]);

        if (!faceapi.nets.ssdMobilenetv1.isLoaded) {
            throw new Error('Face detection model failed to load');
        }

        modelsLoaded = true;
        console.log('Face-api models loaded successfully');
    } catch (error) {
        modelsLoaded = false;
        console.error('Error initializing face-api:', error);
        throw error;
    }
};

// utils/imageProcessing.js
class ImageProcessor {
    static async prepareCanvas(imageData1) {
        try {
            const imageBuffer = await this.normalizeImageBuffer(imageData1);
            const img = await loadImage(imageBuffer);
            console.log("img",img)
            console.log('Image dimensions:', img.width, img.height);
            // Tạo canvas với kích thước của image đã load  
            const canvas = createCanvas(img.width, img.height);
            const ctx = canvas.getContext('2d');
        console.log('Canvas dimensions:', canvas.width, canvas.height);
            
            // Clear và vẽ image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            // Verify image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            if (!imageData.data.some(pixel => pixel !== 0)) {
                throw new Error('Canvas vẽ ra trống');
            }
            console.log('ImageData size:', imageData.data.length);
        console.log('First few pixels:', imageData.data.slice(0, 20));
            // Setup canvas properties
            canvas.getContext = () => ctx;
            canvas.toBuffer = () => canvas.toBuffer('image/png');
            canvas.addEventListener = () => {};
            canvas.removeEventListener = () => {};
            canvas.naturalWidth = img.width;
            canvas.naturalHeight = img.height;
            console.log("canvas",canvas)
            return canvas;
        } catch (error) {
            console.error('Lỗi trong prepareCanvas:', error);
            throw error;
        }
    }

    static async normalizeImageBuffer(imageData) {
        try {
            if (!imageData) {
                throw new Error('No image data provided');
            }

            let buffer;

            // Handle multer file object
            if (imageData.faceImage && imageData.faceImage.buffer) {
                buffer = imageData.faceImage.buffer;
            }
            // Handle data URL string
            else if (typeof imageData === 'string') {
                if (imageData.startsWith('data:image')) {
                    const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (!matches || !matches[2]) {
                        throw new Error('Invalid data URL format');
                    }
                    buffer = Buffer.from(matches[2], 'base64');
                } else {
                    // Assume it's already base64
                    buffer = Buffer.from(imageData, 'base64');
                }
            }
            // Handle Buffer
            else if (Buffer.isBuffer(imageData)) {
                // Check if buffer contains data URL
                const bufferString = imageData.toString();
                if (bufferString.startsWith('data:image')) {
                    const matches = bufferString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches && matches[2]) {
                        buffer = Buffer.from(matches[2], 'base64');
                    } else {
                        throw new Error('Invalid data URL in buffer');
                    }
                } else {
                    buffer = imageData;
                }
            }
            // Handle direct buffer property
            else if (imageData.buffer && Buffer.isBuffer(imageData.buffer)) {
                buffer = imageData.buffer;
            }

            if (!buffer) {
                throw new Error('Could not extract valid image buffer');
            }

            return buffer;
        } catch (error) {
            console.error('Error normalizing image buffer:', error);
            throw error;
        }
    }

    static createAndSetupCanvas(image) {
        try {
            if (!image || !image.width || !image.height) {
                throw new Error('Invalid image dimensions');
            }

            // Tạo canvas với kích thước của ảnh gốc
            const canvas = createCanvas(image.width, image.height);
            console.log("canvas",canvas)
            // Thiết lập kích thước canvas trước khi vẽ
            canvas.width = image.width;
            canvas.height = image.height;
            
            const ctx = canvas.getContext('2d');
            console.log("ctx",ctx)
            
            // Xóa canvas trước khi vẽ
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Vẽ ảnh
            ctx.drawImage(image, 0, 0);
            
            // Thêm thuộc tính để tương thích với face-api
            canvas.naturalWidth = image.width;
            canvas.naturalHeight = image.height;

            // Kiểm tra xem ảnh đã được vẽ chưa
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            console.log("imageData",imageData)
            if (!imageData.data.some(pixel => pixel !== 0)) {
                throw new Error('Canvas is empty after drawing image');
            }
            console.log("canvas",canvas)
            return canvas;
        } catch (error) {
            console.error('Error setting up canvas:', error);
            throw error;
        }
    }
}

// services/faceRecognitionService.js
class FaceRecognitionService {
    static async compareFaces(faceImage1, faceImage2) {
        try {
            if (!modelsLoaded) await initializeFaceApi();

            const [canvas1, canvas2] = await Promise.all([
                ImageProcessor.prepareCanvas(faceImage1),
                ImageProcessor.prepareCanvas(faceImage2)
            ]);
            console.log("canvas1",canvas1)
            console.log("canvas2",canvas2)

            const detectionOptions = new faceapi.SsdMobilenetv1Options({ 
                minConfidence: 0.3,
                maxResults: 1
            });

            const [detection1, detection2] = await Promise.all([
                faceapi.detectSingleFace(canvas1, detectionOptions)
                    .withFaceLandmarks()
                    .withFaceDescriptor(),
                faceapi.detectSingleFace(canvas2, detectionOptions)
                    .withFaceLandmarks()
                    .withFaceDescriptor()
            ]);
            console.log('Detection 1:', detection1 ? 'Found face' : 'No face');
            console.log('Detection 2:', detection2 ? 'Found face' : 'No face');
            if (!detection1 || !detection2) {
                console.log('No face detected in one or both images');
                return 0;
            }

            const distance = faceapi.euclideanDistance(
                detection1.descriptor,
                detection2.descriptor
            );
            
            return Math.max(0, 1 - distance);
        } catch (error) {
            console.error('Face comparison error:', error);
            return 0;
        }
    }

    static async detectFace(canvas, options) {
        return await faceapi.detectSingleFace(canvas, options)
            .withFaceLandmarks()
            .withFaceDescriptor();
    }
}

// services/userService.js
class UserService {
    constructor(db, bcrypt) {
        this.db = db;
        this.bcrypt = bcrypt;
    }

    async handleUserLogin(email, password) {
        return new Promise(async (resolve, reject) => {
            try {
                let userData = {};
                let isExist = await this.checkUserEmail(email);
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
    
    
    async checkUserEmail(userEmail) {
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
    compareUserPassword() {
        return new Promise((resolve, reject) => {
            try {
    
            } catch (error) {
                reject(error)
            }
        })
    }
    getAllUsers = (userId) => {
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
    
    createNewUser = (data) => {
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
    async hashUserPassword(password) {
        return new Promise(async (resolve, reject) => {
            try {
                const salt = bcrypt.genSaltSync(10);
                const hashPassword = await bcrypt.hashSync(password, salt);
                resolve(hashPassword);
            } catch (error) {
                reject(error);
            }
    
    
    
        })
    }
     deleteUser = (userId) => {
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
     updateUserData = (data) => {
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
    async getAllCodeService(typeInput) {
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

    async registerFaceId(userId, faceImage) {
        // Find user with raw: false to get Sequelize instance
        const user = await this.db.User.findOne({
            where: { id: userId },
            raw: false
        });

        if (!user) {
            return this.createErrorResponse(1, "User not found");
        }

        if (user.faceId) {
            return this.createErrorResponse(2, "FaceID already registered");
        }

        // Convert buffer to base64
        const base64Image = faceImage.buffer.toString('base64');
        // Add data URI prefix for image format
        const base64WithPrefix = `data:image/png;base64,${base64Image}`;
        
        user.faceId = base64WithPrefix;
        await user.save();

        return {
            errCode: 0,
            errMessage: "FaceID registration successful"
        };
    }

    async authenticateWithFace(faceImage) {
        const users = await this.db.User.findAll({
            where: {
                faceId: {
                    [this.db.Sequelize.Op.ne]: null
                }
            }
        });

        if (!users?.length) {
            return this.createErrorResponse(1, "No users found with registered Face ID");
        }

        // Convert input image to base64
        const base64Image = faceImage.faceImage.buffer.toString('base64');
        const base64WithPrefix = `data:image/png;base64,${base64Image}`;
        const matchedUser = await this.findMatchingFace(base64WithPrefix, users);
        console.log("matchedUser", matchedUser)
        if (!matchedUser) {
            return this.createErrorResponse(2, "No matching face found");
        }

        return {
            errCode: 0,
            errMessage: "Face authentication successful",
            user: this.sanitizeUser(matchedUser)
        };
    }

    async findMatchingFace(faceImage, users) {
        for (const user of users) {
            try {
                const similarity = await FaceRecognitionService.compareFaces(
                    faceImage,
                    user.faceId
                );
                
                console.log(`Similarity with user ${user.id}:`, similarity);
                if (similarity > 0.85) return user;
            } catch (error) {
                console.error(`Error comparing with user ${user.id}:`, error);
            }
        }
        return null;
    }

    sanitizeUser(user) {
        const { id, firstName, lastName, roleId } = user;
        return { id, firstName, lastName, roleId };
    }

    createErrorResponse(code, message) {
        return {
            errCode: code,
            errMessage: message
        };
    }

    convertToBase64Image(buffer) {
        if (Buffer.isBuffer(buffer)) {
            return `data:image/png;base64,${buffer.toString('base64')}`;
        }
        if (typeof buffer === 'string' && buffer.startsWith('data:image')) {
            return buffer;
        }
        throw new Error('Invalid image format');
    }
}

// Initialize and export
faceapi.env.monkeyPatch(env);

const userServiceInstance = new UserService(db, bcrypt);

module.exports = {
    userService: userServiceInstance,
    FaceRecognitionService,
    ImageProcessor
};