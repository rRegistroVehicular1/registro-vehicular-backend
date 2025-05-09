import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import { AppService } from 'src/app.service';

dotenv.config();

@Injectable()
export class PlacasService {
  private sheets: any;
  private auth: any;

  constructor(private readonly appService: AppService) {
    this.auth = this.appService['auth']; 
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async getPlacasFromSheet() {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
    const range = 'Lista de Placas!C2:C2000';

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      console.log("Datos crudos de Sheets:", response.data);

      if (!response.data.values) {
        return [];
      }
      const rows = response.data.values;
        .flat()
        .filter((placa: string | null) => placa && placa.trim() !== "")
        .filter((placa: string, index: number, self: string[]) => 
          self.indexOf(placa) === index
        );

      console.log("Placas procesadas:", placas);
      return placas;
      
      if (rows && rows.length) {
        const placas = rows.map((row) => row[0].filter(Boolean));
        return placas;
      } else {
        return { message: 'No hay placas disponibles en la hoja.' };
      }
    } catch (error) {
      console.error('Error al obtener las placas de Google Sheets:', error.response?.data || error.message || error);
      throw new Error('Error al obtener las placas de Google Sheets');
    }
  }
}
