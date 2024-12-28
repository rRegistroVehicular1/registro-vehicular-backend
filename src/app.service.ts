import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class AppService {

  private auth: any;
  private sheets: any;

  constructor() {
    this.initializeAuth();
  }

  private initializeAuth() {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const scopes = process.env.GOOGLE_SCOPES?.split(',');

    if (!clientEmail || !privateKey) {
      throw new Error("Faltan las variables de entorno GOOGLE_CLIENT_EMAIL o GOOGLE_PRIVATE_KEY.");
    }

    this.auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      scopes
    );

    console.log("Autenticación inicializada.");
  }

}

