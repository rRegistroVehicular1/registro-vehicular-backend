import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { google } from 'googleapis';
import { AppService } from 'src/app.service';

dotenv.config();

@Injectable()
export class SalidasService {

  private auth: any;
  private sheets: any;

  constructor(private readonly appService: AppService) {
    this.auth = this.appService['auth'];
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async getDataSalidas() {

    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDSALIDAS;
    const range = 'Hoja 1!A4:F';

    try {
      const response = await this.sheets.spreadsheets.values.get({
        auth: this.auth,
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (rows.length) {
        const registros = rows.map((row) => ({
          Conductor: row[0] || '',
          Placa: row[1] || '',
          Hora: row[2] || '',
          Fecha: row[3] || '',
          Sucursal: row[4] || '',
          Alerta: row[5] || '',
        }));
        return registros;
      } else {
        return { message: 'No hay registros disponibles en la hoja.' };
      }
    } catch (error) {
      console.error('Error al obtener los registros de Google Sheets:', error.response?.data || error.message || error);
      throw new Error('Error al obtener los registros de Google Sheets');
    }
  }

  async handleDataSalida(
    placa: string,
    conductor: string,
    fechaRegistro: string,
    sucursal: string,
    horaSalida: string,
    alerta?: string
  ) {

    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDSALIDAS;

    try {
      console.log(conductor, placa, horaSalida, fechaRegistro, sucursal, alerta);

      await this.sheets.spreadsheets.values.append({
        auth: this.auth,
        spreadsheetId,
        range: 'Hoja 1!A5:F5',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[conductor, placa, horaSalida, fechaRegistro, sucursal, alerta]],
        },
      });

      console.log('Datos enviados correctamente a Google Sheets.');
    } catch (error) {
      console.error('Error al procesar datos o subir el archivo:', error.response?.data || error.message || error);
      throw new Error('Error al procesar datos o subir el archivo');
    }

    return { message: 'Datos procesados y almacenados correctamente en Google Sheets' };
  }
}
