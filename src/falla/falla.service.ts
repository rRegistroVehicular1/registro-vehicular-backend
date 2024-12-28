import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { google } from 'googleapis';
import { AppService } from 'src/app.service';
import { Readable } from 'stream';
import nodemailer from 'nodemailer'
import { mailerConfig } from '../mailer.config';

@Injectable()
export class FallaService {

    private sheets: any;
    private auth: any;

    constructor(private readonly appService: AppService) {
        this.auth = this.appService['auth'];
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    }

    async processRegistroFalla(
        sucursal: string,
        fecha: string,
        conductor: string,
        vehiculo: string,
        placa: string,
        detalles: string
    ) {
        const spreadsheetId = process.env.GOOGLE_FALLAS;

        try {

            const response = await this.sheets.spreadsheets.values.get({
                auth: this.auth,
                spreadsheetId,
                range: 'Hoja 1!A:A',
            });

            const numRows = response.data.values ? response.data.values.length : 0;
            const nextRow = numRows + 1;

            await this.sheets.spreadsheets.values.update({
                auth: this.auth,
                spreadsheetId,
                range: `Hoja 1!A${nextRow}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[sucursal, fecha, conductor, vehiculo, placa, detalles]],
                },
            });

            await this.getRowFromSheet(nextRow);

            return {
                message: 'Datos procesados y almacenados correctamente en Google Sheets',
                row: nextRow,
            };
        } catch (error) {
            console.error('Error al procesar datos:', error.response?.data || error.message || error);
            throw new Error('Error al procesar datos');
        }
    }

    private formatDetails(text: string, maxLength: number): string[] {
        const paragraphs: string[] = [];
        let currentParagraph = '';

        text.split(' ').forEach(word => {
            if ((currentParagraph + word).length <= maxLength) {
                currentParagraph += (currentParagraph.length > 0 ? ' ' : '') + word;
            } else {
                paragraphs.push(currentParagraph);
                currentParagraph = word;
            }
        });

        if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph);
        }

        return paragraphs;
    }

    async getRowFromSheet(rowNumber: number) {
        const spreadsheetId = process.env.GOOGLE_FALLAS;
        const sheetName = 'Hoja 1';
        const range = `${sheetName}!A${rowNumber}:F${rowNumber}`;
        const spreadsheetId3 = process.env.GOOGLE_FALLAS_DOCS;

        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range,
            });

            const row = response.data.values;
            console.log(JSON.stringify(row, null, 2));

            const sucursal = row[0][0];
            const fecha = row[0][1];
            const conductor = row[0][2];
            const vehiculo = row[0][3];
            const placa = row[0][4];
            const detalles = row[0][5];

            const formattedDetails = this.formatDetails(detalles, 100);
            const nuevoNumero = await this.generarNumeroConsecutivo(sucursal);

            const clearRequests = [
                { range: 'Hoja 1!A15:F15' },
                { range: 'Hoja 1!A16:F16' },
                { range: 'Hoja 1!A17:F17' },
                { range: 'Hoja 1!A18:F18' },
                { range: 'Hoja 1!A19:F19' },
            ];

            await this.sheets.spreadsheets.values.batchUpdate({
                auth: this.auth,
                spreadsheetId: spreadsheetId3,
                resource: {
                    data: clearRequests,
                    valueInputOption: 'RAW',
                },
            });

            const requests = [
                { range: 'Hoja 1!F7', values: [[nuevoNumero]] },
                { range: 'Hoja 1!C7', values: [[sucursal]] },
                { range: 'Hoja 1!C8', values: [[fecha]] },
                { range: 'Hoja 1!F8', values: [[conductor]] },
                { range: 'Hoja 1!C10', values: [[vehiculo]] },
                { range: 'Hoja 1!F10', values: [[placa]] },
                { range: 'Hoja 1!B14', values: formattedDetails.map(paragraph => [paragraph]) },
            ];

            const data = requests.map(request => ({
                range: request.range,
                values: request.values,
            }));

            await this.sheets.spreadsheets.values.batchUpdate({
                auth: this.auth,
                spreadsheetId: spreadsheetId3,
                resource: {
                    data,
                    valueInputOption: 'RAW',
                },
            });

            const nameText = { sucursal, fecha, conductor, vehiculo, placa };

            const pdfBuffer: Buffer = await this.exportSheetAsPDF(spreadsheetId3);

            const sucursal1 = nameText.sucursal.match(/\((.*?)\)/)?.[1] || '';
            const fechaSinGuiones = nameText.fecha.replace(/-/g, '').replace(', ', '').replace(':', '');
            const originalname = `${fechaSinGuiones}-${sucursal1}-${nameText.placa}- R07-PT-19-Reporte de Falla-${nuevoNumero}`;

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
        const spreadsheetId = process.env.GOOGLE_NUMEROS_CONSECUTIVOS_FALLAS;
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

        const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=pdf`;

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token.token}`
            },
            responseType: 'arraybuffer'
        });

        return Buffer.from(response.data, 'binary');
    }

    async uploadFileToDrive(documento: { originalname: string; mimetype: string; buffer: Buffer }) {

        return new Promise((resolve, reject) => {
            const drive = google.drive({ version: 'v3', auth: this.auth });

            const fileMetadata = {
                name: documento.originalname,
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID2],
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
