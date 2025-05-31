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
    this.sheets = google.sheets({ version: 'v4', auth: this.auth })
  }

  //Función validateTires:
  private validateTires(tipoVehiculo: string, llantas: any[]): void {
      const idsPermitidos = tipoVehiculo === 'camion' ? [1, 2, 5, 6, 7, 8] : [1, 2, 5, 7];
      const idsEnviados = llantas.map(llanta => llanta.id);
      
      const idsInvalidos = idsEnviados.filter(id => !idsPermitidos.includes(id));
      
      if (idsInvalidos.length > 0) {
          throw new Error(`Tipo de vehículo ${tipoVehiculo} no permite llantas con IDs: ${idsInvalidos.join(', ')}`);
      }
  }

  private normalizeTiresData(llantas: any[]): any[] {
    console.log("Llantas antes de normalizar:", llantas); // ← Debe ser un array válido
    // Crea un array con 10 posiciones (para llanta1 a llanta10)
    const normalized = Array(10).fill(null);
    
    // Mapeo de IDs de llantas a posiciones en el array
    const indexMap = {
      1: 0,   // llanta1 (delantera izquierda)
      2: 1,   // llanta2 (delantera derecha)
      5: 4,   // llanta5 (trasera derecha)
      6: 5   // llanta6 (extra trasera derecha)
      7: 6,   // llanta3 (trasera izquierda)
      8: 7,   // llanta4 (extra trasera izquierda)
    };

    llantas.forEach(llanta => {
      if (llanta?.id !== undefined && indexMap[llanta.id] !== undefined) {
        normalized[indexMap[llanta.id]] = llanta;
      }
    });

    console.log("Llantas normalizadas:", normalized); // ← Debe tener objetos en posiciones correctas
    
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
    dasCarroceria: any[],
  ) {
    const spreadsheetId = process.env.GOOGLE_INSPECCIONSALIDAS;
    console.log(spreadsheetId);

    try {
      // 1. Primero validamos las llantas (nueva línea a agregar)
      this.validateTires(tipoVehiculo, llantas);
      
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

      llantas = this.normalizeTiresData(this.processJSON(llantas));
      fluidos = this.processJSON(fluidos);
      parametrosVisuales = this.processJSON(parametrosVisuales);
      luces = this.processJSON(luces);
      insumos = this.processJSON(insumos);
      documentacion = this.processJSON(documentacion);
      dasCarroceria = this.processJSON(dasCarroceria);

      const arrays = this.initializeArrays({
        llantas,
        fluidos,
        parametrosVisuales,
        luces,
        insumos,
        documentacion,
        dasCarroceria,
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
      console.error('Error en validación de llantas:', error);
      console.error('Error al procesar datos o subir el archivo:', error.response?.data || error.message || error);
      throw new Error('Error al procesar datos o subir el archivo');
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
        documentacion1?.nombre, documentacion1?.disponibleSi ? "sí" : "no",
        documentacion2?.nombre, documentacion2?.disponibleSi ? "sí" : "no",
        documentacion3?.nombre, documentacion3?.disponibleSi ? "sí" : "no",
        documentacion4?.nombre, documentacion4?.disponibleSi ? "sí" : "no",
        documentacion5?.nombre, documentacion5?.disponibleSi ? "sí" : "no",
        documentacion6?.nombre, documentacion6?.disponibleSi ? "sí" : "no",
        documentacion7?.nombre, documentacion7?.disponibleSi ? "sí" : "no",
        documentacion8?.nombre, documentacion8?.disponibleSi ? "sí" : "no",
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

  // async actualizarNumeroConsecutivo(sucursal: string) {
  //   const spreadsheetIdConsecutivos = process.env.GOOGLE_NUMEROS_CONSECUTIVOS

  //   try {
  //     // Leer los datos actuales del archivo de consecutivos
  //     const consecutivosData = await this.sheets.spreadsheets.values.get({
  //       auth: this.auth,
  //       spreadsheetId: spreadsheetIdConsecutivos,
  //       range: 'Hoja 1!A:Z', // Asegúrate de que este rango incluye todas las sucursales
  //     });

  //     const rows = consecutivosData.data.values || [];
  //     if (rows.length === 0) {
  //       throw new Error('El archivo de consecutivos está vacío.');
  //     }

  //     // Buscar la columna correspondiente a la sucursal
  //     const headerRow = rows[0]; // Primera fila con los mbres de las sucursales
  //     const columnaSucursal = headerRow.indexOf(sucursal);

  //     if (columnaSucursal === -1) {
  //       throw new Error(`La sucursal "${sucursal}"  existe en el archivo de consecutivos.`);
  //     }

  //     // Obtener los números consecutivos existentes para la sucursal
  //     const numerosSucursal = rows.slice(1).map((row) => parseInt(row[columnaSucursal] || '0', 10));
  //     const ultimoNumero = Math.max(...numerosSucursal, 0); // Encontrar el último número consecutivo

  //     // Generar el nuevo número consecutivo
  //     const nuevoNumero = ultimoNumero + 1;

  //     // Crear una nueva fila con el nuevo número en la columna de la sucursal
  //     const nuevaFila = Array(headerRow.length).fill('');
  //     nuevaFila[columnaSucursal] = nuevoNumero;

  //     // Guardar el nuevo número en el archivo
  //     await this.sheets.spreadsheets.values.append({
  //       auth: this.auth,
  //       spreadsheetId: spreadsheetIdConsecutivos,
  //       range: 'Hoja 1',
  //       valueInputOption: 'RAW',
  //       requestBody: {
  //         values: [nuevaFila],
  //       },
  //     });

  //     console.log(`Nuevo número consecutivo para la sucursal "${sucursal}": ${nuevoNumero}`);
  //     return nuevoNumero;
  //   } catch (error) {
  //     console.error('Error al actualizar el número consecutivo:', error.response?.data || error.message || error);
  //     throw new Error('Error al actualizar el número consecutivo');
  //   }
  // }
  
}
