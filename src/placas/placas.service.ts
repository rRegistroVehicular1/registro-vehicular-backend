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
        spreadsheetId,
        range,
      });

      if (!data.values) {
        console.log('No se encontraron datos en el rango especificado');
        return [];
      }

      const placas = data.values
        .flat()
        .map(item => item ? item.toString().trim() : '')
        .filter(item => item.length > 0);

      console.log('Placas obtenidas:', placas);
      return placas;

    } catch (error) {
      console.error('Error al obtener placas:', error);
      return [];
    }
  }

  async getVehiculosFromSheet(): Promise<Record<string, string>> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
    const range = 'Lista de Placas!A2:C';

    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      if (!data.values) {
        console.log('No se encontraron datos en el rango especificado');
        return {};
      }

      const vehiculosMap: Record<string, string> = {};

      data.values.forEach(row => {
        if (row.length >= 2 && row[0] && row[2]) {
          const numeroVehiculo = row[0].toString().trim();
          const placa = row[2].toString().trim().toUpperCase();
          vehiculosMap[placa] = numeroVehiculo;
        }
      });

      console.log('Mapa de placas a vehículos:', vehiculosMap);
      return vehiculosMap;

    } catch (error) {
      console.error('Error al obtener vehículos:', error);
      return {};
    }
  }

  async getTiposVehiculo(): Promise<Record<string, string>> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
    const range = 'Lista de Placas!C2:D';

    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      if (!data.values) {
        console.log('No se encontraron datos en el rango especificado');
        return {};
      }

      const tiposMap: Record<string, string> = {};

      data.values.forEach(row => {
        if (row.length >= 2 && row[0] && row[1]) {
          const placa = row[0].toString().trim().toUpperCase();
          const tipo = row[1].toString().trim().toLowerCase();
          tiposMap[placa] = tipo;
        }
      });

      console.log('Mapa de placas a tipos de vehículo:', tiposMap);
      return tiposMap;

    } catch (error) {
      console.error('Error al obtener tipos de vehículo:', error);
      return {};
    }
  }

  async getLlantasPorPlaca(): Promise<Record<string, number>> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
    const range = 'Lista de Placas!C2:E'; // C: Placa, E: Cantidad de llantas

    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      if (!data.values) {
        console.log('No se encontraron datos en el rango especificado');
        return {};
      }

      const llantasMap: Record<string, number> = {};

      data.values.forEach(row => {
        if (row.length >= 3 && row[0] && row[2]) {
          const placa = row[0].toString().trim().toUpperCase();
          const cantidad = parseInt(row[2]) || 4; // Default 4 si no hay valor
          llantasMap[placa] = cantidad;
        }
      });

      console.log('Mapa de placas a cantidad de llantas:', llantasMap);
      return llantasMap;

    } catch (error) {
      console.error('Error al obtener llantas por placa:', error);
      return {};
    }
  }

  async getConductoresFromSheet(): Promise<string[]> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
    const range = 'Lista de Conductores!B2:B';

    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      if (!data.values) {
        console.log('No se encontraron conductores en el rango especificado');
        return [];
      }

      const conductores = data.values
        .flat()
        .map(item => item ? item.toString().trim() : '')
        .filter(item => item.length > 0 && item !== 'Nombre del Conductor')
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort((a, b) => a.localeCompare(b));

      console.log('Conductores obtenidos:', conductores);
      return conductores;
    } catch (error) {
      console.error('Error al obtener conductores:', error);
      return [];
    }
  }

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
