
import { Controller, Post, Body, UseInterceptors, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InsRegistroEntradaService } from './ins-registro-entrada.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { BadRequestException } from '@nestjs/common';


@ApiTags('ins-registro-entrada')
@Controller('ins-registro-entrada')
export class InsRegistroEntradaController {
  constructor(private readonly insRegistroEntradaService: InsRegistroEntradaService) { }

  @Get('last-odometro')
  async getLastOdometro(@Query('placa') placa: string) {
    if(!placa){
      throw new BadRequestException('El parámetro "placa" es requerido');
    }
    const lastOdometro = await this.insRegistroEntradaService.getLastOdometro(placa);

    // Depuración adicional
    console.log(`Solicitud de odómetro para ${placa}. Resultado: ${lastOdometro}`);
    
    return { success: true, placa, lastOdometro, timestamp: new Date().toISOString() };
  }
  
  @Post('register')  
  @UseInterceptors(FileInterceptor('documento'))
  async register(@Body() body: any) {

    const {revisiones, observacion, lastPlacaInfo, odometro, placa } = body;

     // Validar que el odómetro sea mayor al último registrado
    const lastOdometro = await this.getLastOdometro(placa);
    if (parseFloat(odometro) <= lastOdometro) {
      throw new BadRequestException(`El odómetro debe ser mayor al último registrado (${lastOdometro})`);
    }
    const result = await this.insRegistroEntradaService.processRegistroEntrada(revisiones, observacion, lastPlacaInfo, odometro);
    return result;
  }
}
