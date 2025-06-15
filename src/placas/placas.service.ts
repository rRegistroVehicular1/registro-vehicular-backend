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

      // Procesamiento robusto
      const placas = data.values
        .flat() // Convierte matriz en array unidimensional
        .map(item => item ? item.toString().trim() : '') // Convierte a string y limpia
        .filter(item => item.length > 0); // Filtra strings vacíos
  
      console.log('Placas obtenidas:', placas);
      return placas;
      
    } catch (error) {
      console.error('Error al obtener placas:', error);
      return []; // Fallback seguro
    }
  }

  async getVehiculosFromSheet(): Promise<Record<string, string>> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
    const range = 'Lista de Placas!A2:C'; // Col A: Número, Col C: Placa

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

  async getTiposVehiculo(): Promise<{tipos: Record<string, string>, llantas: Record<string, number>}> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
    const range = 'Lista de Placas!C2:E'; // Col C: Placa, Col D: Tipo, Col E: Llantas

    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      if (!data.values) {
        return { tipos: {}, llantas: {} };
      }

      const tiposMap: Record<string, string> = {};
      const llantasMap: Record<string, number> = {};
      
      data.values.forEach(row => {
        if (row.length >= 3 && row[0]) {
          const placa = row[0].toString().trim().toUpperCase();
          const tipo = row[1]?.toString().trim().toLowerCase() || '';
          const llantas = parseInt(row[2]?.toString().trim()) || 4;
          
          tiposMap[placa] = tipo;
          llantasMap[placa] = [4, 6, 10].includes(llantas) ? llantas : 4;
        }
      });

      console.log('Mapa de placas a tipos de vehículo:', tiposMap);
      console.log('Mapa de placas a cantidad de llantas:', llantasMap);
      return { tipos: tiposMap, llantas: llantasMap };
      
    } catch (error) {
      console.error('Error al obtener tipos y llantas:', error);
      return { tipos: {}, llantas: {} };
    }
  }

  async getCantidadLlantas(placa: string): Promise<number> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
    const range = 'Lista de Placas!C2:E'; // Col C: Placa, Col E: Cantidad de llantas

    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      if (!data.values) return 4; // Valor por defecto

      const fila = data.values.find(row => 
        row[0] && row[0].toString().trim().toUpperCase() === placa.trim().toUpperCase()
      );

      if (!fila || !fila[2]) return 4; // Valor por defecto si no se encuentra
      
      const cantidad = parseInt(fila[2].toString().trim());
      return [4, 6, 10].includes(cantidad) ? cantidad : 4; // Validar valores permitidos
    } catch (error) {
      console.error('Error al obtener cantidad de llantas:', error);
      return 4; // Valor por defecto en caso de error
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

      // Procesamiento para obtener nombres únicos y ordenados
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
