import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import { AppService } from 'src/app.service';

dotenv.config();

@Injectable()
export class HomeService {
  private sheets: any;
  private auth: any;

  constructor(private readonly appService: AppService) {
    this.auth = this.appService['auth'];
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async checkPlaca(placa: string): Promise<{
    message: string;
    lastTimestamp?: string;
    estado?: string;
    datoColumnaG?: string;
    rowIndex?: number;
  }> {
    const spreadsheetId = process.env.GOOGLE_INSPECCIONSALIDAS;
    const range = 'Hoja 1!A2:H';

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        return { message: 'No hay registros en la hoja.' };
      }

      const normalizedPlaca = placa.trim().toUpperCase();

      const matchingRows = rows
        .map((row, index) => {
          const rawTimestamp = row[0]?.trim();
          const correctedTimestamp = rawTimestamp.replace(
            /(\d{2})\/(\d{2})\/(\d{4}), (\d{2}:\d{2}:\d{2})/,
            '$3-$2-$1T$4'
          );
          const timestamp = new Date(correctedTimestamp);

          return {
            timestamp,
            plate: row[1]?.trim().toUpperCase(),
            estado: row[6]?.trim(),
            datoColumnaG: row[6]?.trim(),
            rowIndex: index + 2,
          };
        })
        .filter((record) => {
          return record.plate === normalizedPlaca && !isNaN(record.timestamp.getTime());
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      if (matchingRows.length === 0) {
        return { message: `La placa ${placa} no está registrada.` };
      }

      const lastRecord = matchingRows[0];

      if (lastRecord.datoColumnaG === "entrada") {
        return { message: `La ${placa} ha ingresado a la plataforma.` };
      }

      return {
        message: `La placa ${placa} está registrada.`,
        lastTimestamp: lastRecord.timestamp.toISOString(),
        estado: lastRecord.estado || 'No especificado',
        datoColumnaG: lastRecord.datoColumnaG || 'Dato no disponible',
        rowIndex: lastRecord.rowIndex,
      };

    } catch (error) {
      console.error('Error al consultar la placa en Google Sheets:', error.response?.data || error.message || error);
      throw new Error('Error al consultar la placa en Google Sheets');
    }
  }

}
