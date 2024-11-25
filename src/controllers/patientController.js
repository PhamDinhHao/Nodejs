import patientService from '../services/patientService'
let postBookAppointment = async (req, res) => {
    try {
        let response = await patientService.postBookAppointment(req.body)
        return res.status(200).json(response)
    } catch (error) {
        return res.status(500).json({
            errCode: -1,
            message: error
        })
    }
}

let verifyBookingAppointment = async (req, res) => {
    try {
        let response = await patientService.verifyBookingAppointment(req.body)
        return res.status(200).json(response)
    } catch (error) {
        return res.status(500).json({
            errCode: -1,
            message: 'Error from server'
        })
    }
}

module.exports = {
    postBookAppointment: postBookAppointment,
    verifyBookingAppointment: verifyBookingAppointment
}