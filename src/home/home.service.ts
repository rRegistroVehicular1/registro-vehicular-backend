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
  
      // Buscar todos los registros de la placa ordenados por fecha descendente
      const registrosPlaca = rows
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
            estado: row[6]?.trim(), // Columna G (estado: salida/entrada)
            rowIndex: index + 2,
          };
        })
        .filter(record => record.plate === normalizedPlaca && !isNaN(record.timestamp.getTime()))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
      if (registrosPlaca.length === 0) {
        return { 
          message: `La placa ${placa} no está registrada.`,
          estado: 'nueva' // Estado personalizado para placas nuevas
        };
      }
  
      const ultimoRegistro = registrosPlaca[0];
      
      // Si el último registro es una salida, debe hacer entrada
      if (ultimoRegistro.estado === 'salida') {
        return {
          message: `La placa ${placa} tiene una salida registrada. Proceder con entrada.`,
          estado: 'entrada',
          rowIndex: ultimoRegistro.rowIndex,
          lastTimestamp: ultimoRegistro.timestamp.toISOString()
        };
      }
      
      // Si el último registro es una entrada, debe hacer salida
      return {
        message: `La placa ${placa} tiene una entrada registrada. Proceder con salida.`,
        estado: 'salida',
        rowIndex: ultimoRegistro.rowIndex,
        lastTimestamp: ultimoRegistro.timestamp.toISOString()
      };
  
    } catch (error) {
      console.error('Error al consultar la placa:', error);
      throw new Error('Error al consultar la placa en Google Sheets');
    }
  }

}
