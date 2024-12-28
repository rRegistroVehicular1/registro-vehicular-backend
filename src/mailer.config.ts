import { MailerOptions } from "@nestjs-modules/mailer";
import * as dotenv from 'dotenv';
dotenv.config();

export const mailerConfig: MailerOptions = {
    transport:{
        host:process.env.GMAIL_HOST,
        port:587,
        secure:false,
        auth:{
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASSWORD
        },
        tls:{
            rejectUnauthorized: false
        }
    },
}