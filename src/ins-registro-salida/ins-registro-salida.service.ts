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

  async handleData(
    placa: string,
    conductor: string,
    sucursal: string,
    tipoVehiculo: string,
    odometroSalida: string,
    estadoSalida: string,
    llantasParte1: any[],
    llantasParte2: any[],
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

      llantasParte1 = this.processJSON(llantasParte1);
      llantasParte2 = this.processJSON(llantasParte2);
      fluidos = this.processJSON(fluidos);
      parametrosVisuales = this.processJSON(parametrosVisuales);
      luces = this.processJSON(luces);
      insumos = this.processJSON(insumos);
      documentacion = this.processJSON(documentacion);
      dasCarroceria = this.processJSON(dasCarroceria);

      const arrays = this.initializeArrays({
        llantasParte1,
        llantasParte2,
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
        return null;
      }
    }
    return data;
  }

  private initializeArrays({
    llantasParte1,
    llantasParte2,
    fluidos,
    parametrosVisuales,
    luces,
    insumos,
    documentacion,
    dasCarroceria,
  }: any) {
    return {
      llanta1: llantasParte1[0],
      llanta2: llantasParte1[1],
      llanta3: llantasParte1[2],
      llanta4: llantasParte1[3],
      llanta5: llantasParte1[4],
      llanta6: llantasParte2[0],
      llanta7: llantasParte2[1],
      llanta8: llantasParte2[2],
      llanta9: llantasParte2[3],
      llanta10: llantasParte2[4],
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
        "llanta 1", llanta1?.fp ? "sí" : " ", llanta1?.pe ? "sí" : "", llanta1?.pa ? "sí" : "", llanta1?.desgaste ? "x" : "",
        "llanta 2", llanta2?.fp ? "sí" : "", llanta2?.pe ? "sí" : "", llanta2?.pa ? "sí" : "", llanta2?.desgaste ? "x" : "",
        "llanta 3", llanta3?.fp ? "sí" : "", llanta3?.pe ? "sí" : "", llanta3?.pa ? "sí" : "", llanta3?.desgaste ? "x" : "",
        "llanta 4", llanta4?.fp ? "sí" : "", llanta4?.pe ? "sí" : "", llanta4?.pa ? "sí" : "", llanta4?.desgaste ? "x" : "",
        "llanta 5", llanta5?.fp ? "sí" : "", llanta5?.pe ? "sí" : "", llanta5?.pa ? "sí" : "", llanta5?.desgaste ? "x" : "",
        "llanta 6", llanta6?.fp ? "sí" : "", llanta6?.pe ? "sí" : "", llanta6?.pa ? "sí" : "", llanta6?.desgaste ? "x" : "",
        "llanta 7", llanta7?.fp ? "sí" : "", llanta7?.pe ? "sí" : "", llanta7?.pa ? "sí" : "", llanta7?.desgaste ? "x" : "",
        "llanta 8", llanta8?.fp ? "sí" : "", llanta8?.pe ? "sí" : "", llanta8?.pa ? "sí" : "", llanta8?.desgaste ? "x" : "",
        "llanta 9", llanta9?.fp ? "sí" : "", llanta9?.pe ? "sí" : "", llanta9?.pa ? "sí" : "", llanta9?.desgaste ? "x" : "",
        "llanta 10", llanta10?.fp ? "sí" : "", llanta10?.pe ? "sí" : "", llanta10?.pa ? "sí" : "", llanta10?.desgaste ? "x" : "",
        observacionGeneralLlantas,
        "Nivel 1", fluido1?.nombre, fluido1?.requiere ? "sí" : "", fluido1?.lleno ? "sí" : "",
        "Nivel 2", fluido2?.nombre, fluido2?.requiere ? "sí" : "", fluido2?.lleno ? "sí" : "",
        "Nivel 3", fluido3?.nombre, fluido3?.requiere ? "sí" : "", fluido3?.lleno ? "sí" : "",
        "Nivel 4", fluido4?.nombre, fluido4?.requiere ? "sí" : "", fluido4?.lleno ? "sí" : "",
        observacionGeneralFluido,
        "",
        parametros1?.nombre, parametros1?.si ? "sí" : "no",
        parametros2?.nombre, parametros2?.si ? "sí" : "no",
        parametros3?.nombre, parametros3?.si ? "sí" : "no",
        parametros4?.nombre, parametros4?.si ? "sí" : "no",
        observacionGeneralVisuales,
        "",
        luces1?.nombre, luces1?.funcionaSi ? "sí" : "no",
        luces2?.nombre, luces2?.funcionaSi ? "sí" : "no",
        luces3?.nombre, luces3?.funcionaSi ? "sí" : "no",
        luces4?.nombre, luces4?.funcionaSi ? "sí" : "no",
        luces5?.nombre, luces5?.funcionaSi ? "sí" : "no",
        luces6?.nombre, luces6?.funcionaSi ? "sí" : "no",
        luces7?.nombre, luces7?.funcionaSi ? "sí" : "no",
        luces8?.nombre, luces8?.funcionaSi ? "sí" : "no",
        "",
        insumo1?.nombre, insumo1?.disponibleSi ? "sí" : "no",
        insumo2?.nombre, insumo2?.disponibleSi ? "sí" : "no",
        insumo3?.nombre, insumo3?.disponibleSi ? "sí" : "no",
        insumo4?.nombre, insumo4?.disponibleSi ? "sí" : "no",
        insumo5?.nombre, insumo5?.disponibleSi ? "sí" : "no",
        insumo6?.nombre, insumo6?.disponibleSi ? "sí" : "no",
        insumo7?.nombre, insumo7?.disponibleSi ? "sí" : "no",
        insumo8?.nombre, insumo8?.disponibleSi ? "sí" : "no",
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
        "Daño 1", dasCarroceria1?.vista, dasCarroceria1?.rayones ? "sí" : "no", dasCarroceria1?.golpes ? "sí" : "no", dasCarroceria1?.quebrado ? "sí" : "no",
        dasCarroceria1?.faltante ? "sí" : "no",
        "Daño 2", dasCarroceria2?.vista, dasCarroceria2?.rayones ? "sí" : "no", dasCarroceria2?.golpes ? "sí" : "no", dasCarroceria2?.quebrado ? "sí" : "no",
        dasCarroceria2?.faltante ? "sí" : "no",
        "Daño 3", dasCarroceria3?.vista, dasCarroceria3?.rayones ? "sí" : "no", dasCarroceria3?.golpes ? "sí" : "no", dasCarroceria3?.quebrado ? "sí" : "no",
        dasCarroceria3?.faltante ? "sí" : "no",
        "Daño 4", dasCarroceria4?.vista, dasCarroceria4?.rayones ? "sí" : "no", dasCarroceria4?.golpes ? "sí" : "no", dasCarroceria4?.quebrado ? "sí" : "no",
        dasCarroceria4?.faltante ? "sí" : "no"
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
