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

  private validateTires(cantidadEsperada: number, llantas: any[]): void {
    // Validar cantidad de llantas
    if (llantas.length !== cantidadEsperada) {
      throw new Error(`Se esperaban ${cantidadEsperada} llantas pero se recibieron ${llantas.length}`);
    }

    // Definir IDs permitidos según cantidad
    let idsPermitidos: number[];
    switch (cantidadEsperada) {
      case 4:
        idsPermitidos = [1, 2, 5, 7];
        break;
      case 6:
        idsPermitidos = [1, 2, 5, 6, 7, 8];
        break;
      case 10:
        idsPermitidos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        break;
      default:
        throw new Error(`Cantidad de llantas no soportada: ${cantidadEsperada}`);
    }

    // Validar IDs individuales
    const idsEnviados = llantas.map(llanta => llanta.id);
    const idsInvalidos = idsEnviados.filter(id => !idsPermitidos.includes(id));

    if (idsInvalidos.length > 0) {
      throw new Error(`Configuración de ${cantidadEsperada} llantas no permite IDs: ${idsInvalidos.join(', ')}`);
    }
  }

  private normalizeTiresData(llantas: any[], cantidadEsperada: number): any[] {
    console.log("Llantas recibidas:", llantas);
    
    // Crear array con todas las posiciones posibles (1-10)
    const normalized = Array(10).fill(null).map((_, index) => {
      const id = index + 1;
      const llantaExistente = llantas.find(l => l.id === id);
      return llantaExistente || {
        id,
        nombre: `${id} - ${this.getPosicionNombre(id)}`,
        posicion: this.getPosicion(id),
        lado: this.getLado(id),
        fp: false,
        pe: false,
        pa: false,
        desgaste: false
      };
    });

    // Filtrar según cantidad esperada
    let llantasFiltradas: any[];
    switch (cantidadEsperada) {
      case 4:
        llantasFiltradas = normalized.filter(llanta => [1, 2, 5, 7].includes(llanta.id));
        break;
      case 6:
        llantasFiltradas = normalized.filter(llanta => [1, 2, 5, 6, 7, 8].includes(llanta.id));
        break;
      case 10:
        llantasFiltradas = normalized;
        break;
      default:
        llantasFiltradas = normalized.filter(llanta => [1, 2, 5, 7].includes(llanta.id));
    }

    console.log("Llantas normalizadas:", llantasFiltradas);
    return llantasFiltradas;
  }

  private getPosicion(id: number): string {
    const posiciones = {
      1: 'delantera',
      2: 'delantera',
      3: 'extra-delantera',
      4: 'extra-delantera',
      5: 'trasera',
      6: 'extra-trasera',
      7: 'trasera',
      8: 'extra-trasera',
      9: 'central',
      10: 'central'
    };
    return posiciones[id] || 'desconocida';
  }

  private getLado(id: number): string {
    return id % 2 === 1 ? 'izquierda' : 'derecha';
  }

  private getPosicionNombre(id: number): string {
    const posiciones = {
      1: 'Delantera Izquierda',
      2: 'Delantera Derecha',
      3: 'Extra Delantera Izquierda',
      4: 'Extra Delantera Derecha',
      5: 'Trasera Derecha',
      6: 'Extra Trasera Derecha',
      7: 'Trasera Izquierda',
      8: 'Extra Trasera Izquierda',
      9: 'Central Izquierda',
      10: 'Central Derecha'
    };
    return posiciones[id] || 'Posición Desconocida';
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
    cantidadLlantas: number // Nuevo parámetro recibido del frontend
  ) {
    const spreadsheetId = process.env.GOOGLE_INSPECCIONSALIDAS;
    console.log(spreadsheetId);

    try {
      // 1. Validar llantas según cantidad esperada
      this.validateTires(cantidadLlantas, llantas);
      
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

      // Normalizar datos
      llantas = this.normalizeTiresData(this.processJSON(llantas), cantidadLlantas);
      fluidos = this.processJSON(fluidos);
      parametrosVisuales = this.processJSON(parametrosVisuales);
      luces = this.processJSON(luces);
      insumos = this.processJSON(insumos);
      documentacion = this.processJSON(documentacion);
      danosCarroceria = this.processJSON(danosCarroceria);

      const arrays = this.initializeArrays({
        llantas,
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
        cantidadLlantas, // Pasamos la cantidad de llantas
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
      return { 
        message: 'Datos procesados y almacenados correctamente en Google Sheets',
        cantidadLlantas: cantidadLlantas // Incluimos la cantidad en la respuesta
      };
    } catch (error) {
      console.error('Error al procesar datos:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      throw new Error(`Error al procesar datos: ${error.message}`);
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
    fluidos,
    parametrosVisuales,
    luces,
    insumos,
    documentacion,
    danosCarroceria,
  }: any) {
    return {
      llanta1: llantas[0],
      llanta2: llantas[1],
      llanta3: llantas[2],
      llanta4: llantas[3],
      llanta5: llantas[4],
      llanta6: llantas[5],
      llanta7: llantas[6],
      llanta8: llantas[7],
      llanta9: llantas[8],
      llanta10: llantas[9],
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
    cantidadLlantas,
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
    
    // Base del array de valores
    const baseValues = [
      fechaHoraActual,
      placa,
      conductor,
      sucursal,
      tipoVehiculo,
      odometroSalida,
      estadoSalida,
      cantidadLlantas, // Nueva columna para cantidad de llantas
    ];

    // Función para agregar datos de llantas según cantidad
    const addTiresData = (values: any[]) => {
      // Siempre agregamos las 10 posiciones, pero el frontend solo mostrará las necesarias
      values.push(
        "llanta 1", llanta1?.fp ? "√" : " ", llanta1?.pe ? "√" : "", llanta1?.pa ? "√" : "", llanta1?.desgaste ? "x" : "",
        "llanta 2", llanta2?.fp ? "√" : "", llanta2?.pe ? "√" : "", llanta2?.pa ? "√" : "", llanta2?.desgaste ? "x" : "",
        "llanta 3", llanta3?.fp ? "√" : "", llanta3?.pe ? "√" : "", llanta3?.pa ? "√" : "", llanta3?.desgaste ? "x" : "",
        "llanta 4", llanta4?.fp ? "√" : "", llanta4?.pe ? "√" : "", llanta4?.pa ? "√" : "", llanta4?.desgaste ? "x" : "",
        "llanta 5", llanta5?.fp ? "√" : "", llanta5?.pe ? "√" : "", llanta5?.pa ? "√" : "", llanta5?.desgaste ? "x" : "",
        "llanta 6", llanta6?.fp ? "√" : "", llanta6?.pe ? "√" : "", llanta6?.pa ? "√" : "", llanta6?.desgaste ? "x" : "",
        "llanta 7", llanta7?.fp ? "√" : "", llanta7?.pe ? "√" : "", llanta7?.pa ? "√" : "", llanta7?.desgaste ? "x" : "",
        "llanta 8", llanta8?.fp ? "√" : "", llanta8?.pe ? "√" : "", llanta8?.pa ? "√" : "", llanta8?.desgaste ? "x" : "",
        "llanta 9", llanta9?.fp ? "√" : "", llanta9?.pe ? "√" : "", llanta9?.pa ? "√" : "", llanta9?.desgaste ? "x" : "",
        "llanta 10", llanta10?.fp ? "√" : "", llanta10?.pe ? "√" : "", llanta10?.pa ? "√" : "", llanta10?.desgaste ? "x" : "",
        observacionGeneralLlantas
      );
      return values;
    };

    // Resto de los valores (fluidos, parámetros visuales, etc.)
    const restOfValues = [
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
      "Daño 1", danosCarroceria1?.vista, danosCarroceria1?.rayones ? "X" : "no", danosCarroceria1?.golpes ? "/" : "no", 
      danosCarroceria1?.quebrado ? "O" : "no", danosCarroceria1?.faltante ? "*" : "no",
      "Daño 2", danosCarroceria2?.vista, danosCarroceria2?.rayones ? "X" : "no", danosCarroceria2?.golpes ? "/" : "no", 
      danosCarroceria2?.quebrado ? "O" : "no", danosCarroceria2?.faltante ? "*" : "no",
      "Daño 3", danosCarroceria3?.vista, danosCarroceria3?.rayones ? "X" : "no", danosCarroceria3?.golpes ? "/" : "no", 
      danosCarroceria3?.quebrado ? "O" : "no", danosCarroceria3?.faltante ? "*" : "no",
      "Daño 4", danosCarroceria4?.vista, danosCarroceria4?.rayones ? "X" : "no", danosCarroceria4?.golpes ? "/" : "no", 
      danosCarroceria4?.quebrado ? "O" : "no", danosCarroceria4?.faltante ? "*" : "no"
    ];

    // Combinar todos los valores
    return [addTiresData(baseValues).concat(restOfValues)];
  }
}
