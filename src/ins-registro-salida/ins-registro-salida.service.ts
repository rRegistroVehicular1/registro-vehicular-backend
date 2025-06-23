import { Injectable } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { google } from 'googleapis';
import { SalidasService } from 'src/salidas/salidas.service';
import { PlacasService } from '../placas/placas.service';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class InsRegistroSalidaService {
  private sheets: any;
  private auth: any;

  constructor(
    private readonly appService: AppService,
    private readonly salidasService: SalidasService,
    private readonly placasService: PlacasService,
  ) {
    this.auth = this.appService['auth'];
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  private validateTires(cantidadLlantas: number, llantas: any[]): void {
    const configuracionesLlantas = {
      4: [1, 2, 5, 7],
      6: [1, 2, 5, 6, 7, 8],
      10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    };

    const idsPermitidos = configuracionesLlantas[cantidadLlantas] || [1, 2, 5, 7];
    const idsEnviados = llantas.map(llanta => llanta.id);
    
    const idsInvalidos = idsEnviados.filter(id => !idsPermitidos.includes(id));
    
    if (idsInvalidos.length > 0) {
      throw new Error(`Configuración de ${cantidadLlantas} llantas no permite IDs: ${idsInvalidos.join(', ')}`);
    }
  }

  private normalizeTiresData(llantas: any[], cantidadLlantas: number): any[] {
    const configuracionesPosiciones = {
      4: { 1: 0, 2: 1, 5: 2, 7: 3 },
      6: { 1: 0, 2: 1, 5: 2, 6: 3, 7: 4, 8: 5 },
      10: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9 }
    };

    const posiciones = configuracionesPosiciones[cantidadLlantas] || configuracionesPosiciones[4];
    const normalized = Array(cantidadLlantas).fill(null);
    
    llantas.forEach(llanta => {
      if (llanta?.id !== undefined && posiciones[llanta.id] !== undefined) {
        normalized[posiciones[llanta.id]] = llanta;
      }
    });
    
    return normalized;
  }

  async handleData(
    placa: string,
    conductor: string,
    sucursal: string,
    tipoVehiculo: string,
    odometroSalida: string,
    estadoSalida: string,
    llantas: any[],
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
      // 1. Primero obtener la cantidad de llantas para esta placa
      const llantasPorPlaca = await this.placasService.getLlantasPorPlaca();
      const cantidadLlantas = llantasPorPlaca[placa] || 4;

      // 2. Validar que las llantas enviadas coincidan con la cantidad esperada
      const idsLlantasEnviadas = llantas.map(llanta => llanta.id);
      const idsEsperados = this.getIdsLlantasEsperados(cantidadLlantas);
      
      const llantasInvalidas = idsLlantasEnviadas.filter(id => !idsEsperados.includes(id));
      if (llantasInvalidas.length > 0) {
        throw new Error(`La placa ${placa} requiere ${cantidadLlantas} llantas (IDs esperados: ${idsEsperados.join(', ')})`);
      }
      
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

      // Normalizar datos de llantas según cantidad
      llantas = this.normalizeTiresData(this.processJSON(llantas), cantidadLlantas);
      fluidos = this.processJSON(fluidos);
      parametrosVisuales = this.processJSON(parametrosVisuales);
      luces = this.processJSON(luces);
      insumos = this.processJSON(insumos);
      documentacion = this.processJSON(documentacion);
      danosCarroceria = this.processJSON(danosCarroceria);

      const arrays = this.initializeArrays({
        llantas,
        cantidadLlantas,
        fluidos,
        parametrosVisuales,
        luces,
        insumos,
        documentacion,
        danosCarroceria,
      });

      const values = this.buildValues({
        fechaHoraActual,
        placa,
        conductor,
        sucursal,
        tipoVehiculo,
        odometroSalida,
        estadoSalida,
        observacionGeneralLlantas,
        fluidos,
        observacionGeneralFluido,
        observacionGeneralVisuales,
        ...arrays,
      });

      const response = await this.sheets.spreadsheets.values.append({
        auth: this.auth,
        spreadsheetId,
        range: 'Hoja 1!A2',
        valueInputOption: 'RAW',
        requestBody: {
          values: values,
        },
      });

      const updatedRange = response.data.updates.updatedRange;
      const filaInsertada = parseInt(updatedRange.match(/\d+/g).pop(), 10);

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: `Hoja 1!GF${filaInsertada}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[HoraSalida]],
        },
      });

      await this.salidasService.handleDataSalida(placa, conductor, fechaHoraActual, sucursal, HoraSalida);

      console.log('Datos enviados correctamente a Google Sheets.');
      return { message: 'Datos procesados y almacenados correctamente en Google Sheets' };
    } catch (error) {
      console.error('Error al procesar datos:', error.response?.data || error.message || error);
      throw new Error(`Error al procesar datos: ${error.message}`);
    }
  }

  // Método auxiliar para obtener IDs esperados
  private getIdsLlantasEsperados(cantidad: number): number[] {
    switch(cantidad) {
      case 4: return [1, 2, 5, 7];
      case 6: return [1, 2, 5, 6, 7, 8];
      case 10: return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      default: return [1, 2, 5, 7];
    }
  }

  private processJSON(data: any): any {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('Error al analizar la cadena JSON:', error);
        return [];
      }
    }
    return Array.isArray(data) ? data : [];
  }

  private initializeArrays({
    llantas,
    cantidadLlantas,
    fluidos,
    parametrosVisuales,
    luces,
    insumos,
    documentacion,
    danosCarroceria,
  }: any) {
    // Inicializar todas las llantas posibles
    const llantasMap = {};
    for (let i = 1; i <= 10; i++) {
      llantasMap[`llanta${i}`] = llantas[i - 1] || null;
    }

    return {
      ...llantasMap,
      fluido1: fluidos[0],
      fluido2: fluidos[1],
      fluido3: fluidos[2],
      fluido4: fluidos[3],
      parametros1: parametrosVisuales[0],
      parametros2: parametrosVisuales[1],
      parametros3: parametrosVisuales[2],
      parametros4: parametrosVisuales[3],
      luces1: luces[0],
      luces2: luces[1],
      luces3: luces[2],
      luces4: luces[3],
      luces5: luces[4],
      luces6: luces[5],
      luces7: luces[6],
      luces8: luces[7],
      insumo1: insumos[0],
      insumo2: insumos[1],
      insumo3: insumos[2],
      insumo4: insumos[3],
      insumo5: insumos[4],
      insumo6: insumos[5],
      insumo7: insumos[6],
      insumo8: insumos[7],
      documentacion1: documentacion[0],
      documentacion2: documentacion[1],
      documentacion3: documentacion[2],
      documentacion4: documentacion[3],
      documentacion5: documentacion[4],
      documentacion6: documentacion[5],
      documentacion7: documentacion[6],
      documentacion8: documentacion[7],
      danosCarroceria1: danosCarroceria[0],
      danosCarroceria2: danosCarroceria[1],
      danosCarroceria3: danosCarroceria[2],
      danosCarroceria4: danosCarroceria[3],
    };
  }

  private buildValues({
    fechaHoraActual,
    placa,
    conductor,
    sucursal,
    tipoVehiculo,
    odometroSalida,
    estadoSalida,
    observacionGeneralLlantas,
    observacionGeneralFluido,
    observacionGeneralVisuales,
    ...arrays
  }: any) {
    const {
      llanta1, llanta2, llanta3, llanta4, llanta5,
      llanta6, llanta7, llanta8, llanta9, llanta10,
      fluido1, fluido2, fluido3, fluido4,
      parametros1, parametros2, parametros3, parametros4,
      luces1, luces2, luces3, luces4, luces5, luces6, luces7, luces8,
      insumo1, insumo2, insumo3, insumo4, insumo5, insumo6, insumo7, insumo8,
      documentacion1, documentacion2, documentacion3, documentacion4,
      documentacion5, documentacion6, documentacion7, documentacion8,
      danosCarroceria1, danosCarroceria2, danosCarroceria3, danosCarroceria4,
    } = arrays;
    
    const llantasValues = [];
    for (let i = 1; i <= 10; i++) {
      const llanta = arrays[`llanta${i}`];
      if (llanta) {
        llantasValues.push(
          `llanta ${i}`,
          llanta?.fp ? "√" : " ",
          llanta?.pe ? "√" : "",
          llanta?.pa ? "√" : "",
          llanta?.desgaste ? "x" : ""
        );
      }
    }

    return [
      [
        fechaHoraActual,
        placa,
        conductor,
        sucursal,
        tipoVehiculo,
        odometroSalida,
        estadoSalida,
        ...llantasValues,
        observacionGeneralLlantas,
        "Nivel 1", fluido1?.nombre, fluido1?.requiere ? "√" : "", fluido1?.lleno ? "√" : "",
        "Nivel 2", fluido2?.nombre, fluido2?.requiere ? "√" : "", fluido2?.lleno ? "√" : "",
        "Nivel 3", fluido3?.nombre, fluido3?.requiere ? "√" : "", fluido3?.lleno ? "√" : "",
        "Nivel 4", fluido4?.nombre, fluido4?.requiere ? "√" : "", fluido4?.lleno ? "√" : "",
        observacionGeneralFluido,
        "",
        parametros1?.nombre, parametros1?.si ? "sí" : "no",
        parametros2?.nombre, parametros2?.si ? "sí" : "no",
        parametros3?.nombre, parametros3?.si ? "sí" : "no",
        parametros4?.nombre, parametros4?.si ? "sí" : "no",
        observacionGeneralVisuales,
        "",
        luces1?.nombre, 
        luces1?.funcionaSi ? "sí" : luces1?.funcionaNo ? "no" : "N/A",
        luces2?.nombre, 
        luces2?.funcionaSi ? "sí" : luces2?.funcionaNo ? "no" : "N/A",
        luces3?.nombre, 
        luces3?.funcionaSi ? "sí" : luces3?.funcionaNo ? "no" : "N/A",
        luces4?.nombre, 
        luces4?.funcionaSi ? "sí" : luces4?.funcionaNo ? "no" : "N/A",
        luces5?.nombre, 
        luces5?.funcionaSi ? "sí" : luces5?.funcionaNo ? "no" : "N/A",
        luces6?.nombre, 
        luces6?.funcionaSi ? "sí" : luces6?.funcionaNo ? "no" : "N/A",
        luces7?.nombre, 
        luces7?.funcionaSi ? "sí" : luces7?.funcionaNo ? "no" : "N/A",
        luces8?.nombre, 
        luces8?.funcionaSi ? "sí" : luces8?.funcionaNo ? "no" : "N/A",
        "",
        insumo1?.nombre, 
        insumo1?.disponibleSi ? "sí" : insumo1?.disponibleNo ? "no" : "N/A",
        insumo2?.nombre, 
        insumo2?.disponibleSi ? "sí" : insumo2?.disponibleNo ? "no" : "N/A",
        insumo3?.nombre, 
        insumo3?.disponibleSi ? "sí" : insumo3?.disponibleNo ? "no" : "N/A",
        insumo4?.nombre, 
        insumo4?.disponibleSi ? "sí" : insumo4?.disponibleNo ? "no" : "N/A",
        insumo5?.nombre, 
        insumo5?.disponibleSi ? "sí" : insumo5?.disponibleNo ? "no" : "N/A",
        insumo6?.nombre, 
        insumo6?.disponibleSi ? "sí" : insumo6?.disponibleNo ? "no" : "N/A",
        insumo7?.nombre, 
        insumo7?.disponibleSi ? "sí" : insumo7?.disponibleNo ? "no" : "N/A",
        insumo8?.nombre, 
        insumo8?.disponibleSi ? "sí" : insumo8?.disponibleNo ? "no" : "N/A",
        "",
        documentacion1?.nombre,
        documentacion1?.disponibleSi ? "sí" : documentacion1?.disponibleNo ? "no" : "N/A",
        documentacion2?.nombre,
        documentacion2?.disponibleSi ? "sí" : documentacion2?.disponibleNo ? "no" : "N/A",
        documentacion3?.nombre,
        documentacion3?.disponibleSi ? "sí" : documentacion3?.disponibleNo ? "no" : "N/A",
        documentacion4?.nombre,
        documentacion4?.disponibleSi ? "sí" : documentacion4?.disponibleNo ? "no" : "N/A",
        documentacion5?.nombre,
        documentacion5?.disponibleSi ? "sí" : documentacion5?.disponibleNo ? "no" : "N/A",
        documentacion6?.nombre,
        documentacion6?.disponibleSi ? "sí" : documentacion6?.disponibleNo ? "no" : "N/A",
        documentacion7?.nombre,
        documentacion7?.disponibleSi ? "sí" : documentacion7?.disponibleNo ? "no" : "N/A",
        documentacion8?.nombre,
        documentacion8?.disponibleSi ? "sí" : documentacion8?.disponibleNo ? "no" : "N/A",
        "",
        "Daño 1", danosCarroceria1?.vista, danosCarroceria1?.rayones ? "X" : "no", 
        danosCarroceria1?.golpes ? "/" : "no", danosCarroceria1?.quebrado ? "O" : "no",
        danosCarroceria1?.faltante ? "*" : "no",
        "Daño 2", danosCarroceria2?.vista, danosCarroceria2?.rayones ? "X" : "no", 
        danosCarroceria2?.golpes ? "/" : "no", danosCarroceria2?.quebrado ? "0" : "no",
        danosCarroceria2?.faltante ? "*" : "no",
        "Daño 3", danosCarroceria3?.vista, danosCarroceria3?.rayones ? "X" : "no", 
        danosCarroceria3?.golpes ? "/" : "no", danosCarroceria3?.quebrado ? "0" : "no",
        danosCarroceria3?.faltante ? "*" : "no",
        "Daño 4", danosCarroceria4?.vista, danosCarroceria4?.rayones ? "X" : "no", 
        danosCarroceria4?.golpes ? "/" : "no", danosCarroceria4?.quebrado ? "0" : "no",
        danosCarroceria4?.faltante ? "*" : "no"
      ],
    ];
  }
}
