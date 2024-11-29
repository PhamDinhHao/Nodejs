const db = require("../models");

let createSpecialty = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.name || !data.descriptionHTML || !data.descriptionMarkdown || !data.imageBase64) {
                resolve({
                    errCode: 1,
                    message: "Missing required parameters!"
                });
            }
            else {
                await db.Specialty.create({
                    name: data.name,
                    descriptionHTML: data.descriptionHTML,
                    descriptionMarkdown: data.descriptionMarkdown,
                    image: data.imageBase64
                });
                resolve({
                    errCode: 0,
                    message: "Create specialty successfully!"
                });
            }
        } catch (e) {
            reject(e);
        }
    })
}

let getAllSpecialty = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let specialties = await db.Specialty.findAll();
            if (specialties && specialties.length > 0) {
                specialties.map((item) => {
                    item.image = new Buffer(item.image, 'base64').toString('binary');
                    return item;
                })
                resolve({
                    errCode: 0,
                    message: "Get all specialties successfully!",
                    specialties: specialties
                });
            }
            else {
                resolve({
                    errCode: 1,
                    message: "Specialties not found!"
                });
            }
        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {
    createSpecialty: createSpecialty,
    getAllSpecialty: getAllSpecialty
}
