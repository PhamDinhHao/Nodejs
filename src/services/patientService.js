import db from '../models/index'
require('dotenv').config()
import emailService from './emailService'
import { v4 as uuidv4 } from 'uuid';
let buildUrlEmail = (doctorId, token) => {
    let result = `${process.env.URL}/verify-booking?token=${token}&doctorId=${doctorId}`
    return result
}

let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        
        try {
            if (!data.email || !data.doctorId || !data.date || !data.timeType || !data.fullName || !data.selectedGender || !data.address ) {
                resolve({
                    errCode: 1,
                    message: 'Missing required parameters'
                })
            }
            else{
                let token = uuidv4()
                await emailService.sendSimpleEmail({
                    receiverEmail: data.email,
                    patientName: data.fullName,
                    time: data.timeString,
                    doctorName: data.doctorName,
                    language: data.language,
                    redirectLink: buildUrlEmail(data.doctorId, token)
                })
                let user = await db.User.findOne({
                    where: { email: data.email },
                    defaults: {
                        email: data.email,
                        roleId: 'R3',
                        gender: data.selectedGender,
                        address: data.address,
                        firstName: data.fullName
                    }
                })
                if (user) {
                    await db.Booking.findOrCreate({
                        where: {
                            patientId: user.id,
                        },
                        defaults: {
                            statusId: 'S1',
                            doctorId: data.doctorId,
                            patientId: user.id,
                            date: data.date.toString(),
                            timeType: data.timeType,
                            token: token
                        }
                    })
                    resolve({
                        errCode: 0,
                        message: 'Create new booking success'
                    })
                }
                else {
                    resolve({
                        errCode: 2,
                        message: 'User not found'
                    })
                }   
            }

        } catch (error) {
            reject(error)
        }
    })
}
let verifyBookingAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.token || !data.doctorId) {
                resolve({
                    errCode: 1,
                    message: 'Missing required parameters'
                })
            }
            else {
                let booking = await db.Booking.findOne({
                    where: { token: data.token, doctorId: data.doctorId, statusId: 'S1' },
                    raw: false,
                })
                if (booking) {
                    await db.Booking.update({ statusId: 'S2' }, { where: { id: booking.id } })
                }
                else {
                    resolve({
                        errCode: 2,
                        message: 'Booking not found'
                    })
                }
            }
        } catch (error) {
            reject(error)
        }
    })
}
module.exports = {
    postBookAppointment: postBookAppointment,
    verifyBookingAppointment: verifyBookingAppointment
}