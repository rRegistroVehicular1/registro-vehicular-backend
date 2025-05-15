import { Controller, Post, Body, UseInterceptors, Get, Query, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InsRegistroEntradaService } from './ins-registro-entrada.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('ins-registro-entrada')
@Controller('ins-registro-entrada')
export class InsRegistroEntradaController {
  constructor(private readonly insRegistroEntradaService: InsRegistroEntradaService) { }

  @Get('last-odometro')
  async getLastOdometro(@Query('placa') placa: string) {
    if(!placa) {
      throw new BadRequestException('El parámetro "placa" es requerido');
    }
    return this.insRegistroEntradaService.getLastOdometro(placa);
  }
  
  @Post('register')
  @UseInterceptors(FileInterceptor('documento'))
  async register(@Body() body: any) {
    try {
      const { revisiones, observacion, lastPlacaInfo, odometro, sucursal } = body;
      
      if (!lastPlacaInfo) {
        throw new BadRequestException('Se requiere lastPlacaInfo');
      }

      return await this.insRegistroEntradaService.processRegistroEntrada(
        revisiones,
        observacion,
        lastPlacaInfo,
        odometro,
        sucursal
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Error procesando registro',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
