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

  async getPlacasFromSheet(): Promise<numeroVehiculo: string, placa: string}[]> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
    const range = 'Lista de Placas!A2:C'; // A: N° Vehículo, C: Placa

    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      if (!data.values) {
        console.log('No se encontraron datos en el rango especificado');
        return [];
      }

      // Procesamiento robusto
      const placas = data.values
        .map(row => {
          const numeroVehiculo = row[0]?.toString().trim() || '';
          const placa = row[2]?.toString().trim() || '';
          return { numeroVehiculo, placa };
        })
        .filter(item => item.placa.length > 0); // Filtra placas vacías

      console.log('Placas obtenidas:', placas); // Para diagnóstico
      return placas;

    } catch (error) {
      console.error('Error al obtener placas:', error);
      return []; // Fallback seguro
    }
  }

  // (Opcional) Método para diagnóstico
  async testSheetConnection(): Promise<boolean> {
    try {
      const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
      const res = await this.sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties.title'
      });
      console.log('Hojas disponibles:', res.data.sheets.map(s => s.properties.title));
      return true;
    } catch (error) {
      console.error('Error de conexión:', error);
      return false;
    }
  }
}
