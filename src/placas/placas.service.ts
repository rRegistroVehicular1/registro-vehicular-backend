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

  async getPlacasFromSheet(): Promise<string[]> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
    const range = 'Lista de Placas!C2:C';

    try {
      const { data } = await this.sheets.spreadsheets.values.get({
@@ -37,27 +37,31 @@
        .filter(item => item.length > 0); // Filtra strings vacíos

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
