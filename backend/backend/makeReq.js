const express = require('express');
const nodemailer = require('nodemailer');

var routerRequest = express.Router();

// настойки на имейл от който ще се изпращат съобщенията
var transporter = nodemailer.createTransport({
  host: 'smtp.abv.bg',
  port: 465,
  auth: {
    user: 'razzoto123@abv.bg',
    pass: 'J014106nsa'
  }
});

// изпращане на заявка за нов калъф
routerRequest.route('/makeReq').post((req, res) => {

  const name = req.body.phoneModule
  const width = req.body.width
  const height = req.body.height
  const thickness = req.body.thickness
  const color = req.body.color
  const email = req.body.email
  const moreInfo = req.body.moreInfo

  if (!name || !height || !width || !thickness || !color || !email || !moreInfo) {
    console.log(name);
    console.log(width);
    console.log(height);
    console.log(thickness);
    console.log(color);
    console.log(email);
    console.log(moreInfo);

    return res.status(400).json({ error: "Invalid parameter" });
  }

  // имейл до мен
  var mailOptions = {
    from: 'razzoto123@abv.bg',
    to: 'razzoto123@abv.bg', email,
    subject: 'Заявка за нов калъф',
    text: "name:" + name + "\nwidth: " + width + "\nheight: " + height +
      "\n thickness :" + thickness + "\n color: " + color + "\n email: " + email +
      "\n moreInfo: " + moreInfo,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

  //res.send(JSON.stringify({ message: "Благодарим за заявката тя ще бъде обработена и ще получите отговор." }));
})

module.exports = routerRequest;
