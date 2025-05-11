
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
    const lastOdometro = await this.insRegistroEntradaService.getLastOdometro(placa);
    return { lastOdometro };
  }
  
  @Post('register')  
  @UseInterceptors(FileInterceptor('documento'))
  async register(@Body() body: any) {

    const {revisiones, observacion, lastPlacaInfo, odometro, placa } = body;

     // Validar que el odómetro sea mayor al último registrado
    const lastOdometro = await this.getLastOdometro(placa);
    if (parseFloat(odometro) <= lastOdometroValue) {
      throw new BadRequestException(`El odómetro debe ser mayor al último registrado (${lastOdometroValue})`);
    }
    const result = await this.insRegistroEntradaService.processRegistroEntrada(revisiones, observacion, lastPlacaInfo, odometro);
    return result;
  }
}
