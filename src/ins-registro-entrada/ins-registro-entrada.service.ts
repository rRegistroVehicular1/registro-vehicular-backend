import { Injectable } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { google } from 'googleapis';
import axios from 'axios';
import { Readable } from 'stream';
import nodemailer from 'nodemailer'
import { mailerConfig } from '../mailer.config';
import { PDFDocument } from 'pdf-lib';

@Injectable()
export class InsRegistroEntradaService {
  private sheets: any;
  private auth: any;

  constructor(private readonly appService: AppService) {
    this.auth = this.appService['auth'];
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  async processRegistroEntrada(
    revisiones: [],
    observacion: string,
    lastPlacaInfo: string,
    odometro: string,
  ) {
    const spreadsheetId = process.env.GOOGLE_INSPECCIONSALIDAS;

    try {
      revisiones = this.processJSON(revisiones);
      const arrays = this.initializeArrays({ revisiones });
      const values = this.buildValues({ observacion, ...arrays });

      const rowNumber = parseInt(lastPlacaInfo, 10);

      const startColumn = 'FG';
      const range = `Hoja 1!${startColumn}${rowNumber}`;

      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values,
        },
      });

      const columnGRange = `Hoja 1!G${rowNumber}:G${rowNumber}`;
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: columnGRange,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['entrada']],
        },
      });

      const HoraEntrada = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'America/Panama',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date());

      const columnGRange2 = `Hoja 1!GG${rowNumber}:GG${rowNumber}`;
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: columnGRange2,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[HoraEntrada]],
        },
      });

      const columnGRange3 = `Hoja 1!GH${rowNumber}:GH${rowNumber}`;
      await this.sheets.spreadsheets.values.update({
        auth: this.auth,
        spreadsheetId,
        range: columnGRange3,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[odometro]],
        },
      });

      console.log('Datos enviados correctamente a Google Sheets.');

      const rowData = await this.getRowFromSheet(rowNumber);

      return {
        message: 'Datos procesados y almacenados correctamente en Google Sheets',
        updatedRow: rowData,
      };
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
    revisiones
  }: any) {
    return {
      revisiones1: revisiones[0],
      revisiones2: revisiones[1],
      revisiones3: revisiones[2],
      revisiones4: revisiones[3],
      revisiones5: revisiones[4],
      revisiones6: revisiones[5],
      revisiones7: revisiones[6],
      revisiones8: revisiones[7],
      revisiones9: revisiones[8],
      revisiones10: revisiones[9],
      revisiones11: revisiones[10],
      revisiones12: revisiones[11],
    };
  }

  private buildValues({ observacion, ...arrays }: any) {
    const {
      revisiones1, revisiones2, revisiones3, revisiones4,
      revisiones5, revisiones6, revisiones7, revisiones8,
      revisiones9, revisiones10, revisiones11, revisiones12,
    } = arrays;

    return [
      [
        revisiones1?.descripcion, revisiones1?.opcion ? "sí" : "no",
        revisiones2?.descripcion, revisiones2?.opcion ? "sí" : "no",
        revisiones3?.descripcion, revisiones3?.opcion ? "sí" : "no",
        revisiones4?.descripcion, revisiones4?.opcion ? "sí" : "no",
        revisiones5?.descripcion, revisiones5?.opcion ? "sí" : "no",
        revisiones6?.descripcion, revisiones6?.opcion ? "sí" : "no",
        revisiones7?.descripcion, revisiones7?.opcion ? "sí" : "no",
        revisiones8?.descripcion, revisiones8?.opcion ? "sí" : "no",
        revisiones9?.descripcion, revisiones9?.opcion ? "sí" : "no",
        revisiones10?.descripcion, revisiones10?.opcion ? "sí" : "no",
        revisiones11?.descripcion, revisiones11?.opcion ? "sí" : "no",
        revisiones12?.descripcion, revisiones12?.opcion ? "sí" : "no",
        observacion
      ],
    ];
  }

  async getRowFromSheet(rowNumber: number) {

    const spreadsheetId = process.env.GOOGLE_INSPECCIONSALIDAS;
    const sheetName = 'Hoja 1';
    const range = `${sheetName}!A${rowNumber}:GH${rowNumber}`;

    const spreadsheetrev3 = process.env.GOOGLE_R06PT19REVISIONDEVEHICULOSrev3;

    try {

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const row = response.data.values;
      // console.log(JSON.stringify(row, null, 2));

      const fechaArray = row[0][0];
      const partesFecha = fechaArray.split(',')[0].split('/');
      const dia = partesFecha[0];
      const mes = partesFecha[1];
      const año = partesFecha[2].slice(-2);
      const fecha = `${mes}-${dia}-${año}`;

      const placa = row[0][1];
      const nombreConductor = row[0][2];
      const sucursal = row[0][3];
      const tipoVehiculo = row[0][4];
      const odometro = row[0][5];
      const horas = row[0].slice(-2);
      const HoraSalida = horas[0];
      const HoraEntrada = horas[1];

      const nuevoNumero = await this.generarNumeroConsecutivo(sucursal);

      const llanta1Obs1 = row[0][8];
      const llanta1Obs2 = row[0][9];
      const llanta1Obs3 = row[0][10];
      const llanta1Obs4 = row[0][11];

      const llanta2Obs1 = row[0][13];
      const llanta2Obs2 = row[0][14];
      const llanta2Obs3 = row[0][15];
      const llanta2Obs4 = row[0][16];

      const llanta3Obs1 = row[0][18];
      const llanta3Obs2 = row[0][19];
      const llanta3Obs3 = row[0][20];
      const llanta3Obs4 = row[0][21];

      const llanta4Obs1 = row[0][23];
      const llanta4Obs2 = row[0][24];
      const llanta4Obs3 = row[0][25];
      const llanta4Obs4 = row[0][26];

      const llanta5Obs1 = row[0][28];
      const llanta5Obs2 = row[0][29];
      const llanta5Obs3 = row[0][30];
      const llanta5Obs4 = row[0][31];

      const llanta6Obs1 = row[0][33];
      const llanta6Obs2 = row[0][34];
      const llanta6Obs3 = row[0][35];
      const llanta6Obs4 = row[0][36];

      const llanta7Obs1 = row[0][38];
      const llanta7Obs2 = row[0][39];
      const llanta7Obs3 = row[0][40];
      const llanta7Obs4 = row[0][41];

      const llanta8Obs1 = row[0][43];
      const llanta8Obs2 = row[0][44];
      const llanta8Obs3 = row[0][45];
      const llanta8Obs4 = row[0][46];

      const llanta9Obs1 = row[0][48];
      const llanta9Obs2 = row[0][49];
      const llanta9Obs3 = row[0][50];
      const llanta9Obs4 = row[0][51];

      const llanta10Obs1 = row[0][53];
      const llanta10Obs2 = row[0][54];
      const llanta10Obs3 = row[0][55];
      const llanta10Obs4 = row[0][56];

      const nivel1No = row[0][60];
      const nivel1Si = row[0][61];

      const nivel2No = row[0][64];
      const nivel2Si = row[0][65];

      const nivel3No = row[0][68];
      const nivel3Si = row[0][69];

      const nivel4No = row[0][72];
      const nivel4Si = row[0][73];
      const observacionFluido = row[0][74];

      const Inspección1 = row[0][77];
      const Inspección2 = row[0][79];
      const Inspección3 = row[0][81];
      const Comprobación4 = row[0][83];
      const observacionVisuales = row[0][84];

      const lucesMedias = row[0][87];
      const lucesRetroceso = row[0][89];
      const lucesDerechas = row[0][91];
      const lucesIzquierdas = row[0][93];
      const lucesIntermitentes = row[0][95];
      const lucesStops = row[0][97];
      const lucesCabina = row[0][99];
      const lucesEscolta = row[0][101];

      const primerosAuxilios = row[0][104];
      const conos = row[0][106];
      const triangulos = row[0][108];
      const cuñas = row[0][110];
      const extintor = row[0][112];
      const llantaRepuesto = row[0][114];
      const gato = row[0][116];
      const carretilla = row[0][118];

      const permisoBimensual = row[0][121];
      const permisoAnual = row[0][123];
      const polizaSeguro = row[0][125];
      const tarjetaPesos = row[0][127];
      const licenciaConducir = row[0][129];
      const hojaSeguridad = row[0][131];
      const planEmergencia = row[0][133];
      const registroVehicular = row[0][135];

      const dano1Obs1 = row[0][139];
      const dano1Obs2 = row[0][140];
      const dano1Obs3 = row[0][141];
      const dano1Obs4 = row[0][142];

      const dano2Obs1 = row[0][145];
      const dano2Obs2 = row[0][146];
      const dano2Obs3 = row[0][147];
      const dano2Obs4 = row[0][148];

      const dano3Obs1 = row[0][151];
      const dano3Obs2 = row[0][152];
      const dano3Obs3 = row[0][153];
      const dano3Obs4 = row[0][154];

      const dano4Obs1 = row[0][157];
      const dano4Obs2 = row[0][158];
      const dano4Obs3 = row[0][159];
      const dano4Obs4 = row[0][160];

      const revisionGolpes = row[0][163];
      const revisionLlave = row[0][165];
      const revisionBasura = row[0][167];
      const revisionLuces = row[0][169];
      const maletinPrimerosAuxilios = row[0][171];
      const revisionConos = row[0][173];
      const revisionTriangulos = row[0][175];
      const revisionExtintor = row[0][177];
      const revisionLlantaRepuesto = row[0][179];
      const revisionGato = row[0][181];
      const revisionCarretilla = row[0][183];
      const revisionCuñas = row[0][185];

      const observacionGeneralDatos = row[0][186];
      const odometroEntrada = row[0][189];

      const requests = [

        { range: 'Hoja1!C6', values: [[nuevoNumero]] },
        { range: 'Hoja1!C10', values: [[fecha]] },
        { range: 'Hoja1!I9', values: [[placa]] },
        { range: 'Hoja1!D9', values: [[nombreConductor]] },
        { range: 'Hoja1!C4', values: [[sucursal]] },
        { range: 'Hoja1!H10', values: [[tipoVehiculo]] },
        { range: 'Hoja1!D12', values: [[odometro]] },
        { range: 'Hoja1!I12', values: [[odometroEntrada]] },
        { range: 'Hoja1!C11', values: [[HoraSalida]] },
        { range: 'Hoja1!H11', values: [[HoraEntrada]] },

        { range: 'Hoja1!C18', values: [[llanta1Obs1]] },
        { range: 'Hoja1!D18', values: [[llanta1Obs2]] },
        { range: 'Hoja1!E18', values: [[llanta1Obs3]] },
        { range: 'Hoja1!F18', values: [[llanta1Obs4]] },

        { range: 'Hoja1!C19', values: [[llanta2Obs1]] },
        { range: 'Hoja1!D19', values: [[llanta2Obs2]] },
        { range: 'Hoja1!E19', values: [[llanta2Obs3]] },
        { range: 'Hoja1!F19', values: [[llanta2Obs4]] },

        { range: 'Hoja1!C20', values: [[llanta3Obs1]] },
        { range: 'Hoja1!D20', values: [[llanta3Obs2]] },
        { range: 'Hoja1!E20', values: [[llanta3Obs3]] },
        { range: 'Hoja1!F20', values: [[llanta3Obs4]] },

        { range: 'Hoja1!C21', values: [[llanta4Obs1]] },
        { range: 'Hoja1!D21', values: [[llanta4Obs2]] },
        { range: 'Hoja1!E21', values: [[llanta4Obs3]] },
        { range: 'Hoja1!F21', values: [[llanta4Obs4]] },

        { range: 'Hoja1!C22', values: [[llanta5Obs1]] },
        { range: 'Hoja1!D22', values: [[llanta5Obs2]] },
        { range: 'Hoja1!E22', values: [[llanta5Obs3]] },
        { range: 'Hoja1!F22', values: [[llanta5Obs4]] },

        { range: 'Hoja1!C23', values: [[llanta6Obs1]] },
        { range: 'Hoja1!D23', values: [[llanta6Obs2]] },
        { range: 'Hoja1!E23', values: [[llanta6Obs3]] },
        { range: 'Hoja1!F23', values: [[llanta6Obs4]] },

        { range: 'Hoja1!C24', values: [[llanta7Obs1]] },
        { range: 'Hoja1!D24', values: [[llanta7Obs2]] },
        { range: 'Hoja1!E24', values: [[llanta7Obs3]] },
        { range: 'Hoja1!F24', values: [[llanta7Obs4]] },

        { range: 'Hoja1!C25', values: [[llanta8Obs1]] },
        { range: 'Hoja1!D25', values: [[llanta8Obs2]] },
        { range: 'Hoja1!E25', values: [[llanta8Obs3]] },
        { range: 'Hoja1!F25', values: [[llanta8Obs4]] },

        { range: 'Hoja1!C26', values: [[llanta9Obs1]] },
        { range: 'Hoja1!D26', values: [[llanta9Obs2]] },
        { range: 'Hoja1!E26', values: [[llanta9Obs3]] },
        { range: 'Hoja1!F26', values: [[llanta9Obs4]] },

        { range: 'Hoja1!C27', values: [[llanta10Obs1]] },
        { range: 'Hoja1!D27', values: [[llanta10Obs2]] },
        { range: 'Hoja1!E27', values: [[llanta10Obs3]] },
        { range: 'Hoja1!F27', values: [[llanta10Obs4]] },

        { range: 'Hoja1!G33', values: [[nivel1Si]] },
        { range: 'Hoja1!H33', values: [[nivel1No]] },

        { range: 'Hoja1!G34', values: [[nivel2Si]] },
        { range: 'Hoja1!H34', values: [[nivel2No]] },

        { range: 'Hoja1!G35', values: [[nivel3Si]] },
        { range: 'Hoja1!H35', values: [[nivel3No]] },

        { range: 'Hoja1!G36', values: [[nivel4Si]] },
        { range: 'Hoja1!H36', values: [[nivel4No]] },
        { range: 'Hoja1!H37', values: [[observacionFluido]] },

        { range: 'Hoja1!G41', values: [[Inspección1]] },
        { range: 'Hoja1!G42', values: [[Inspección2]] },
        { range: 'Hoja1!G43', values: [[Inspección3]] },
        { range: 'Hoja1!G44', values: [[Comprobación4]] },
        { range: 'Hoja1!H45', values: [[observacionVisuales]] },

        { range: 'Hoja1!C50', values: [[lucesMedias]] },
        { range: 'Hoja1!C51', values: [[lucesRetroceso]] },
        { range: 'Hoja1!C52', values: [[lucesDerechas]] },
        { range: 'Hoja1!C53', values: [[lucesIzquierdas]] },
        { range: 'Hoja1!C54', values: [[lucesIntermitentes]] },
        { range: 'Hoja1!C55', values: [[lucesStops]] },
        { range: 'Hoja1!C56', values: [[lucesCabina]] },
        { range: 'Hoja1!C57', values: [[lucesEscolta]] },

        { range: 'Hoja1!F50', values: [[primerosAuxilios]] },
        { range: 'Hoja1!F51', values: [[conos]] },
        { range: 'Hoja1!F52', values: [[triangulos]] },
        { range: 'Hoja1!F53', values: [[cuñas]] },
        { range: 'Hoja1!F54', values: [[extintor]] },
        { range: 'Hoja1!F55', values: [[llantaRepuesto]] },
        { range: 'Hoja1!F56', values: [[gato]] },
        { range: 'Hoja1!F57', values: [[carretilla]] },

        { range: 'Hoja1!I50', values: [[permisoBimensual]] },
        { range: 'Hoja1!I51', values: [[permisoAnual]] },
        { range: 'Hoja1!I52', values: [[polizaSeguro]] },
        { range: 'Hoja1!I53', values: [[tarjetaPesos]] },
        { range: 'Hoja1!I54', values: [[licenciaConducir]] },
        { range: 'Hoja1!I55', values: [[hojaSeguridad]] },
        { range: 'Hoja1!I56', values: [[planEmergencia]] },
        { range: 'Hoja1!I57', values: [[registroVehicular]] },

        { range: 'Hoja1!D61', values: [[dano1Obs1]] },
        { range: 'Hoja1!F61', values: [[dano1Obs2]] },
        { range: 'Hoja1!H61', values: [[dano1Obs3]] },
        { range: 'Hoja1!J61', values: [[dano1Obs4]] },

        { range: 'Hoja1!D63', values: [[dano2Obs1]] },
        { range: 'Hoja1!F63', values: [[dano2Obs2]] },
        { range: 'Hoja1!H63', values: [[dano2Obs3]] },
        { range: 'Hoja1!J63', values: [[dano2Obs4]] },

        { range: 'Hoja1!D65', values: [[dano3Obs1]] },
        { range: 'Hoja1!F65', values: [[dano3Obs2]] },
        { range: 'Hoja1!H65', values: [[dano3Obs3]] },
        { range: 'Hoja1!J65', values: [[dano3Obs4]] },

        { range: 'Hoja1!D67', values: [[dano4Obs1]] },
        { range: 'Hoja1!F67', values: [[dano4Obs2]] },
        { range: 'Hoja1!H67', values: [[dano4Obs3]] },
        { range: 'Hoja1!J67', values: [[dano4Obs4]] },

        { range: 'Hoja1!E69', values: [[nombreConductor]] },
        { range: 'Hoja1!G75', values: [[revisionGolpes]] },
        { range: 'Hoja1!G76', values: [[revisionLlave]] },
        { range: 'Hoja1!G77', values: [[revisionBasura]] },
        { range: 'Hoja1!G78', values: [[revisionLuces]] },
        { range: 'Hoja1!G79', values: [[maletinPrimerosAuxilios]] },
        { range: 'Hoja1!G80', values: [[revisionConos]] },
        { range: 'Hoja1!G81', values: [[revisionTriangulos]] },
        { range: 'Hoja1!G82', values: [[revisionExtintor]] },
        { range: 'Hoja1!G83', values: [[revisionLlantaRepuesto]] },
        { range: 'Hoja1!G84', values: [[revisionGato]] },
        { range: 'Hoja1!G85', values: [[revisionCarretilla]] },
        { range: 'Hoja1!G86', values: [[revisionCuñas]] },
        { range: 'Hoja1!C87', values: [[observacionGeneralDatos]] },

      ];

      const data = requests.map(request => ({
        range: request.range,
        values: request.values,
      }));

      await this.sheets.spreadsheets.values.batchUpdate({
        auth: this.auth,
        spreadsheetId: spreadsheetrev3,
        resource: {
          data,
          valueInputOption: 'RAW',
        },
      });

      const nameText = { fecha, placa, nombreConductor, sucursal };

      const pdfBuffer: Buffer = await this.exportSheetAsPDF(spreadsheetrev3);
      const sucursal1 = nameText.sucursal.match(/\((.*?)\)/)?.[1] || '';
      const fechaSinGuiones = nameText.fecha.replace(/-/g, '').replace(', ', '').replace(':', '');
      const originalname = `${fechaSinGuiones}-${sucursal1}-${nameText.placa}-R06-PT-19-Revisión de Vehículos-${nuevoNumero}`;

      await this.uploadFileToDrive({
        originalname,
        mimetype: 'application/pdf',
        buffer: pdfBuffer,
      });

      console.log('Archivo PDF subido a Google Drive');

      const recipientEmail = 'vehicularregistro526@gmail.com';
      await this.sendEmail(pdfBuffer, recipientEmail, originalname);

    } catch (error) {
      console.error('Error al obtener los datos de la fila de Google Sheets:', error.response?.data || error.message || error);
      throw new Error('Error al obtener los datos de la fila de Google Sheets');
    }
  }

  async generarNumeroConsecutivo(sucursal: string) {
    const spreadsheetId = process.env.GOOGLE_NUMEROS_CONSECUTIVOS;
    const sheetName = 'Hoja 1';

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z1`,
      });

      const encabezados = response.data.values[0];

      const columnaIndex = encabezados.findIndex((columna: string) => columna.trim().toLowerCase() === sucursal.trim().toLowerCase());
      if (columnaIndex === -1) {
        throw new Error(`Sucursal ${sucursal} no encontrada en el encabezado.`);
      }

      const columnaLetra = String.fromCharCode(65 + columnaIndex);

      const valoresResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!${columnaLetra}2:${columnaLetra}`,
      });

      const valores = valoresResponse.data.values || [];
      const ultimoNumero = valores.length ? parseInt(valores[valores.length - 1][0]) : 0;

      const nuevoNumero = ultimoNumero + 1;

      const nuevaFila = valores.length + 2;
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!${columnaLetra}${nuevaFila}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[nuevoNumero]],
        },
      });

      console.log(`Nuevo número consecutivo para ${sucursal}: ${nuevoNumero}`);
      return nuevoNumero;
    } catch (error) {
      console.error('Error al generar número consecutivo:', error);
      throw new Error('No se pudo generar el número consecutivo.');
    }
  }

  async exportSheetAsPDF(spreadsheetId: string): Promise<Buffer> {
    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      process.env.GOOGLE_SCOPES?.split(',')
    );

    await auth.authorize();
    const token = await auth.getAccessToken();

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=pdf&size=A4&portrait=true&fitw=true&top_margin=0.5&bottom_margin=0.5&left_margin=0.5&right_margin=0.5`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token.token}` },
      responseType: 'arraybuffer'
    });

    const pdfBuffer = Buffer.from(response.data, 'binary');

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    pages.forEach(page => {
      page.setSize(595, 842);
    });

    const modifiedPdfBytes = await pdfDoc.save();
    return Buffer.from(modifiedPdfBytes);
  }

  async uploadFileToDrive(documento: { originalname: string; mimetype: string; buffer: Buffer }) {

    console.log(documento.originalname);

    return new Promise((resolve, reject) => {
      const drive = google.drive({ version: 'v3', auth: this.auth });

      const fileMetadata = {
        name: documento.originalname,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };

      const media = {
        mimeType: documento.mimetype,
        body: Readable.from(documento.buffer),
      };

      drive.files.create(
        {
          requestBody: fileMetadata,
          media: media,
          fields: 'id',
        },
        (error, file) => {
          if (error) {
            console.error('Error al subir archivo a Google Drive:', error);
            reject(error);
          } else {
            const fileId = file.data.id;

            drive.permissions.create({
              fileId: fileId,
              requestBody: {
                role: 'reader',
                type: 'anyone',
              },
            }, (error) => {
              if (error) {
                console.error('Error al configurar permisos en Google Drive:', error);
                reject(error);
              } else {
                const publicUrl = `https://drive.google.com/file/d/${fileId}/view`;
                resolve(publicUrl);
              }
            });
          }
        }
      );
    });
  }

  async sendEmail(pdfBuffer: Buffer, recipientEmail: string, uniqueIdentifier: string) {

    const transporter = nodemailer.createTransport(mailerConfig.transport);

    const mailOptions = {
      from: mailerConfig.transport.auth.user,
      to: recipientEmail,
      subject: 'Reporte de inspección de salida',
      text: 'Por favor, encuentre el reporte de inspección adjunto en formato PDF.',
      attachments: [
        {
          filename: `${uniqueIdentifier}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    return transporter.sendMail(mailOptions);
  }

}
