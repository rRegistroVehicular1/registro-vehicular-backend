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

  private validateTires(cantidadLlantas: number, llantas: any[]): void {
    let idsPermitidos: number[];
    
    switch(cantidadLlantas) {
      case 4:
        idsPermitidos = [1, 2, 5, 7]; // Delantera izq/der, Trasera der/izq
        break;
      case 6:
        idsPermitidos = [1, 2, 5, 6, 7, 8]; // Delantera + Trasera + Extras
        break;
      case 10:
        idsPermitidos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Todas las posiciones
        break;
      default:
        idsPermitidos = [1, 2, 5, 7]; // Default a 4 llantas
    }
    
    const idsEnviados = llantas.map(llanta => llanta.id);
    const idsInvalidos = idsEnviados.filter(id => !idsPermitidos.includes(id));
    
    if (idsInvalidos.length > 0) {
      throw new Error(`Configuración de ${cantidadLlantas} llantas no permite IDs: ${idsInvalidos.join(', ')}`);
    }
  }

  private normalizeTiresData(llantas: any[], cantidadLlantas: number): any[] {
    // Crear array con todas las posiciones posibles
    const todasLasPosiciones = Array(10).fill(null);
    
    // Mapear las llantas recibidas a sus posiciones
    llantas.forEach(llanta => {
      if (llanta && llanta.id >= 1 && llanta.id <= 10) {
        todasLasPosiciones[llanta.id - 1] = llanta;
      }
    });

    // Seleccionar solo las llantas necesarias según la cantidad
    let llantasNormalizadas = [];
    switch(cantidadLlantas) {
      case 4:
        llantasNormalizadas = [
          todasLasPosiciones[0], // ID 1
          todasLasPosiciones[1], // ID 2
          todasLasPosiciones[4], // ID 5
          todasLasPosiciones[6]  // ID 7
        ];
        break;
      case 6:
        llantasNormalizadas = [
          todasLasPosiciones[0], // ID 1
          todasLasPosiciones[1], // ID 2
          todasLasPosiciones[4], // ID 5
          todasLasPosiciones[5], // ID 6
          todasLasPosiciones[6], // ID 7
          todasLasPosiciones[7]  // ID 8
        ];
        break;
      case 10:
        llantasNormalizadas = todasLasPosiciones;
        break;
      default:
        llantasNormalizadas = [
          todasLasPosiciones[0],
          todasLasPosiciones[1],
          todasLasPosiciones[4],
          todasLasPosiciones[6]
        ];
    }

    console.log('Las llantas son: ', llantasNormalizadas)

    // Filtrar valores null (por si alguna llanta no fue enviada)
    return llantasNormalizadas.filter(llanta => llanta !== null);
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
    dasCarroceria,
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
      dasCarroceria1: dasCarroceria[0],
      dasCarroceria2: dasCarroceria[1],
      dasCarroceria3: dasCarroceria[2],
      dasCarroceria4: dasCarroceria[3],
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
      dasCarroceria1, dasCarroceria2, dasCarroceria3, dasCarroceria4,
    } = arrays;
    
    return [
      [
        fechaHoraActual,
        placa,
        conductor,
        sucursal,
        tipoVehiculo,
        odometroSalida,
        estadoSalida,
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
        documentacion1?.disponibleSi ? "sí" : documentacion1?.disponibleNo ? "no" : "N/A" ,
        documentacion2?.nombre,
        documentacion2?.disponibleSi ? "sí" : documentacion2?.disponibleNo ? "no" : "N/A" ,
        documentacion3?.nombre,
        documentacion3?.disponibleSi ? "sí" : documentacion3?.disponibleNo ? "no" : "N/A" ,
        documentacion4?.nombre,
        documentacion4?.disponibleSi ? "sí" : documentacion4?.disponibleNo ? "no" : "N/A" ,
        documentacion5?.nombre,
        documentacion5?.disponibleSi ? "sí" : documentacion5?.disponibleNo ? "no" : "N/A" ,
        documentacion6?.nombre,
        documentacion6?.disponibleSi ? "sí" : documentacion6?.disponibleNo ? "no" : "N/A" ,
        documentacion7?.nombre,
        documentacion7?.disponibleSi ? "sí" : documentacion7?.disponibleNo ? "no" : "N/A" ,
        documentacion8?.nombre,
        documentacion8?.disponibleSi ? "sí" : documentacion8?.disponibleNo ? "no" : "N/A" ,
        "",
        "Daño 1", dasCarroceria1?.vista, dasCarroceria1?.rayones ? "X" : "no", dasCarroceria1?.golpes ? "/" : "no", dasCarroceria1?.quebrado ? "O" : "no",
        dasCarroceria1?.faltante ? "*" : "no",
        "Daño 2", dasCarroceria2?.vista, dasCarroceria2?.rayones ? "X" : "no", dasCarroceria2?.golpes ? "/" : "no", dasCarroceria2?.quebrado ? "0" : "no",
        dasCarroceria2?.faltante ? "*" : "no",
        "Daño 3", dasCarroceria3?.vista, dasCarroceria3?.rayones ? "X" : "no", dasCarroceria3?.golpes ? "/" : "no", dasCarroceria3?.quebrado ? "0" : "no",
        dasCarroceria3?.faltante ? "*" : "no",
        "Daño 4", dasCarroceria4?.vista, dasCarroceria4?.rayones ? "X" : "no", dasCarroceria4?.golpes ? "/" : "no", dasCarroceria4?.quebrado ? "0" : "no",
        dasCarroceria4?.faltante ? "*" : "no"
      ],
    ];
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
    dasCarroceria: any[],
  ) {
    const spreadsheetId = process.env.GOOGLE_INSPECCIONSALIDAS;

    try {
      // Obtener cantidad de llantas para esta placa
      const cantidadResponse = await this.sheets.spreadsheets.values.get({
        auth: this.auth,
        spreadsheetId: process.env.GOOGLE_SPREADSHEETIDPLACAS,
        range: 'Lista de Placas!C2:E',
      });
      
      let cantidadLlantas = 4; // Valor por defecto
      if (cantidadResponse.data.values) {
        const placaRow = cantidadResponse.data.values.find(row => 
          row[0]?.toString().trim().toUpperCase() === placa.toUpperCase()
        );
        if (placaRow && placaRow[2]) {
          cantidadLlantas = parseInt(placaRow[2]) || 4;
        }
      }

      // Validar y normalizar las llantas según la cantidad configurada
      this.validateTires(cantidadLlantas, llantas);
      const llantasNormalizadas = this.normalizeTiresData(llantas, cantidadLlantas);

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

      const arrays = this.initializeArrays({
        llantas: llantasNormalizadas,
        fluidos: this.processJSON(fluidos),
        parametrosVisuales: this.processJSON(parametrosVisuales),
        luces: this.processJSON(luces),
        insumos: this.processJSON(insumos),
        documentacion: this.processJSON(documentacion),
        dasCarroceria: this.processJSON(dasCarroceria),
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
      console.error('Error al procesar datos o subir el archivo:', error.response?.data || error.message || error);
      throw new Error('Error al procesar datos o subir el archivo');
    }
  }
}
