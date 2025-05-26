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

  async getPlacasAndTypesFromSheet(): Promise<{placas: string[], tipos: string[], placaTipoMap: Record<string, string>}> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
    const range = 'Lista de Placas!C2:D'; // Columna C: Placas, Columna D: Tipo de Vehículo

    try {
      const { data } = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      if (!data.values) {
        console.log('No se encontraron datos en el rango especificado');
        return {placas: [], tipos: [], placaTipoMap: {}};
      }

      const placas: string[] = [];
      const tipos: string[] = [];
      const placaTipoMap: Record<string, string> = {};
      
      data.values.forEach(row => {
            if (row.length >= 2 && row[0] && row[1]) {
                const placa = row[0].toString().trim();
                const tipo = row[1].toString().trim().toLowerCase();
                
                placas.push(placa);
                tipos.push(tipo);
                placaTipoMap[placa] = tipo;
            }
      });
      
      console.log('Placas y tipos obtenidos:', {placas, tipos, placaTipoMap}); // Para diagnóstico
      return {placas, tipos, placaTipoMap};
      
    } catch (error) {
      console.error('Error al obtener placas y tipos:', error);
      return {placas: [], tipos: [], placaTipoMap: {}}; // Fallback seguro
    }
  }

  async getVehiculosFromSheet(): Promise<Record<string, string>> {
      const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
      const range = 'Lista de Placas!A2:C'; // Asumiendo que col A es número de vehículo y col C es placa
  
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
              if (row.length >= 2 && row[0] && row[2]) { // Asegurarse que hay datos en col A y C
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
