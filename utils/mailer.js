import nodemailer from 'nodemailer';
import activationEmailHTML from '../template/email/activationEmail.js'
import dotev from 'dotenv'
import resetPassEmailHTML from '../template/email/resetPassEmail.js';
dotev.config()

const transporter = nodemailer.createTransport({
    service: process.env.SMTP_EMAIL_SERVICE,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_EMAIL_LOGIN,
        pass: process.env.SMTP_EMAIL_PASS
    }
});

export async function sendEmail (email, subject, html) {
    
    const mailOptions = {
        from: process.env.SMTP_EMAIL_LOGIN,
        to: email,
        subject: subject,
        text: "",
        html: html
    };

    transporter.sendMail(mailOptions, function(err, info) {
        if (err) {
            console.log(err);
        } else {
            return true
        }
    });
}

export function sendActivationLink (to, link) {

    const mailOptions = {
        from: process.env.SMTP_EMAIL_LOGIN,
        to: to,
        subject: "Активация аккаунта" ,
        text: '',
        html: activationEmailHTML(link)
    };

    transporter.sendMail(mailOptions, function(err, info) {
        if (err) {
            console.log(err);
        }
    });
}

export function sendResetPassLink (to, link) {

    const mailOptions = {
        from: process.env.SMTP_EMAIL_LOGIN,
        to: to,
        subject: "Сброс пароля" ,
        text: '',
        html: resetPassEmailHTML(link)
    };

    transporter.sendMail(mailOptions, function(err, info) {
        if (err) {
            console.log(err);
        }
    });
}