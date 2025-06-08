import { Injectable } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { google } from 'googleapis';
import { SalidasService } from 'src/salidas/salidas.service';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class InsRegistroSalidaService {
  private sheets: any;
  private auth: any;

  constructor(
    private readonly appService: AppService,
    private readonly salidasService: SalidasService,
  ) {
    this.auth = this.appService['auth'];
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  private validateTires(llantas: any[], cantidadLlantas: number): void {
    const configuracionesValidas = {
      4: [1, 2, 5, 7],    // IDs para 4 llantas
      6: [1, 2, 5, 6, 7, 8], // IDs para 6 llantas
      10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // IDs para 10 llantas
    };

    const idsPermitidos = configuracionesValidas[cantidadLlantas] || [];
    const idsRecibidos = llantas.map(llanta => llanta.id);
    
    const idsInvalidos = idsRecibidos.filter(id => !idsPermitidos.includes(id));
    
    if (idsInvalidos.length > 0) {
      throw new Error(`Configuración de ${cantidadLlantas} llantas no permite los IDs: ${idsInvalidos.join(', ')}`);
    }
  }

  private normalizeTiresData(llantas: any[], cantidadLlantas: number): any[] {
    const posiciones = {
      4: [1, 2, 5, 7],     // Posiciones para 4 llantas
      6: [1, 2, 5, 6, 7, 8],  // Posiciones para 6 llantas
      10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // Posiciones para 10 llantas
    };

    const normalized = Array(10).fill(null);
    const idsPermitidos = posiciones[cantidadLlantas] || [];

    llantas.forEach(llanta => {
      if (llanta?.id !== undefined && idsPermitidos.includes(llanta.id)) {
        const index = idsPermitidos.indexOf(llanta.id);
        normalized[index] = llanta;
      }
    });

    return normalized;
  }

  private processJSON(data: any): any {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('Error al analizar JSON:', error);
        return [];
      }
    }
    return Array.isArray(data) ? data : [];
  }

  async handleData(
    placa: string,
    conductor: string,
    sucursal: string,
    tipoVehiculo: string,
    odometroSalida: string,
    estadoSalida: string,
    llantas: any[],
    cantidadLlantas: number,
    observacionGeneralLlantas: string,
    fluidos: any[],
    observacionGeneralFluido: string,
    parametrosVisuales: any[],
    observacionGeneralVisuales: string,
    luces: any[],
    insumos: any[],
    documentacion: any[],
    danosCarroceria: any[],
  ) {
    const spreadsheetId = process.env.GOOGLE_INSPECCIONSALIDAS;

    try {
      // Validar y normalizar llantas según cantidad
      this.validateTires(llantas, cantidadLlantas);
      llantas = this.normalizeTiresData(this.processJSON(llantas), cantidadLlantas);

      // Procesar otros datos
      fluidos = this.processJSON(fluidos);
      parametrosVisuales = this.processJSON(parametrosVisuales);
      luces = this.processJSON(luces);
      insumos = this.processJSON(insumos);
      documentacion = this.processJSON(documentacion);
      danosCarroceria = this.processJSON(danosCarroceria);

      const fechaHoraActual = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'America/Panama',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date());

      const HoraSalida = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'America/Panama',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date());

      // Construir datos para Google Sheets
      const values = this.buildValues({
        fechaHoraActual,
        placa,
        conductor,
        sucursal,
        tipoVehiculo,
        odometroSalida,
        estadoSalida,
        cantidadLlantas,
        llantas,
        observacionGeneralLlantas,
        fluidos,
        observacionGeneralFluido,
        parametrosVisuales,
        observacionGeneralVisuales,
        luces,
        insumos,
        documentacion,
        danosCarroceria
      });

      // Guardar en Google Sheets
      const response = await this.sheets.spreadsheets.values.append({
        auth: this.auth,
        spreadsheetId,
        range: 'Hoja 1!A2',
        valueInputOption: 'RAW',
        requestBody: { values },
      });

      // Actualizar hora de salida
      const updatedRange = response.data.updates.updatedRange;
      const filaInsertada = parseInt(updatedRange.match(/\d+/g).pop(), 10);

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: `Hoja 1!GF${filaInsertada}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[HoraSalida]] },
      });

      // Registrar salida
      await this.salidasService.handleDataSalida(
        placa, 
        conductor, 
        fechaHoraActual.split(',')[0].trim(), 
        sucursal, 
        HoraSalida
      );

      return { 
        success: true,
        message: 'Datos guardados correctamente',
        cantidadLlantas,
        placa
      };
    } catch (error) {
      console.error('Error al procesar datos:', error);
      throw new Error(`Error al guardar inspección: ${error.message}`);
    }
  }

  private buildValues(data: any) {
    const { cantidadLlantas, llantas } = data;
    const llantasValues = this.buildLlantasValues(llantas, cantidadLlantas);
    
    return [
      [
        data.fechaHoraActual,
        data.placa,
        data.conductor,
        data.sucursal,
        data.tipoVehiculo,
        data.odometroSalida,
        data.estadoSalida,
        ...llantasValues,
        data.observacionGeneralLlantas,
        // ... resto de valores (fluidos, luces, etc)
      ]
    ];
  }

  private buildLlantasValues(llantas: any[], cantidad: number): any[] {
    const values = [];
    const posiciones = {
      4: [1, 2, 5, 7],
      6: [1, 2, 5, 6, 7, 8],
      10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    };

    posiciones[cantidad].forEach(id => {
      const llanta = llantas.find(l => l.id === id) || {};
      values.push(
        `Llanta ${id}`,
        llanta.fp ? "√" : "",
        llanta.pe ? "√" : "",
        llanta.pa ? "√" : "",
        llanta.desgaste ? "x" : ""
      );
    });

    return values;
  }
}
