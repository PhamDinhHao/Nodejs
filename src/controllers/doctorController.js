import doctorService from "../services/doctorService"
let getTopDoctorHome = async (req, res) => {
    let limit = req.query.limit;
    if (!limit) limit = 10;
    try {
        let response = await doctorService.getTopDoctorHome(+limit);


        return res.status(200).json(response);
    }
    catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            message: "Error from server..."
        })
    }
}
let getAllDocters = async (req, res) => {
    try {
        let doctors = await doctorService.getAllDoctors();
        return res.status(200).json(doctors)
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            message: "Error from server..."
        })
    }
}
let postInforDoctor = async (req, res) => {
    try {
        let response = await doctorService.saveDetailInforDoctor(req.body);
        return res.status(200).json(response)
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            message: "Error from server..."
        })
    }
}
let getDetailDoctorById = async (req, res) => {
    try {

        let infor = await doctorService.getDetailDoctorById(req.query.id)
        return res.status(200).json(
            infor
        )

    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            message: "Error from server..."
        })
    }
}
let bulkCreateSchedule = async (req, res) => {
    try {

        let infor = await doctorService.bulkCreateSchedule(req.body)
        return res.status(200).json(
            infor
        )

    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            message: "Error from server..."
        })
    }
}
let getScheduleByDate = async (req, res) => {
    try {

        let infor = await doctorService.getScheduleByDate(req.query.doctorId,req.query.date)
        return res.status(200).json(
            infor
        )

    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            message: "Error from server..."
        })
    }
}
module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDocters: getAllDocters,
    postInforDoctor: postInforDoctor,
    getDetailDoctorById: getDetailDoctorById,
    bulkCreateSchedule: bulkCreateSchedule,
    getScheduleByDate: getScheduleByDate,

}