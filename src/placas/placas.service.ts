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
        console.log("No se encontraron valores en el rango especificado");
        return [];
      }

      // Procesamiento correcto de los datos
      const placas = response.data.values
        .map(row => row[0]?.trim()) // Extrae solo la columna C
        .filter(placa => placa && placa !== "") // Filtra valores vacíos
        .filter((placa, index, self) => self.indexOf(placa) === index); // Elimina duplicados

      console.log("Placas procesadas:", placas);
      return placas;

    } catch (error) {
      console.error('Error al obtener las placas:', {
        error: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      throw new Error('No se pudo obtener el listado de placas');
    }
  }
}
