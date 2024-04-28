import express from "express";
import bodyParser from "body-parser";
import viewEngine from "./config/viewEngine";
import initWebRoutes from "./route/web";
import connectDB from "./config/connectDB";
import cors from 'cors';
require('dotenv').config();

let app = express();
// app.use(cors({ credentials: true, origin: true }));
//add headers
app.use(function (req, res, next) {

    //webstie you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', process.env.URL_REACT);

    //request methods you wish to alloww
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,PATCH,DELETE');

    //request headers youi wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    //set to true if you need the website to include cookies in the request sent to the API(e.g in sace you use session)
    res.setHeader('Access-Control-Allow-Creadentials', true);

    //pass to nexr layer of middleware
    next();
});

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
viewEngine(app);
initWebRoutes(app);

connectDB();
let port = process.env.PORT || 6969;
app.listen(port, () => {
    console.log("Backend Nodejs is runing on the port: " + port);
})
