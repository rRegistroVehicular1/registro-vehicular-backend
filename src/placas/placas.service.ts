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

  async getPlacasFromSheet(): Promise<{placa: string, tipo: string}[]> {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEETIDPLACAS;
    const range = 'Lista de Placas!C2:D'; // Columnas C (placas) y D (tipos de vehiculos)

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
        .map(row => ({
                placa: row[0].toString().trim(),
                tipo: this.normalizarTipoVehiculo(row[1].toString().trim())
            })); // Convierte a string y limpia
        .filter(row => row.length >= 2 && row[0] && row[1]); // Filtra strings vacíos
  
      console.log('Placas obtenidas:', placas); // Para diagnóstico
      
      return placas;
      
    } catch (error) {
      console.error('Error al obtener placas:', error);
      return []; // Fallback seguro
    }
  }

  private normalizarTipoVehiculo(tipo: string): string {
    // Convertir a minúsculas y manejar posibles variaciones
    const tipoLower = tipo.toLowerCase();
    
    // Mapeo de posibles valores a los valores estándar usados en la app
    if (tipoLower.includes('sedan') || tipoLower === 'sedán') return 'sedan';
    if (tipoLower.includes('pickup')) return 'pickup';
    if (tipoLower.includes('panel')) return 'panel';
    if (tipoLower.includes('camion') || tipoLower.includes('camión')) return 'camion';
    
    // Valor por defecto si no coincide (puedes ajustarlo)
    return tipoLower;
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
