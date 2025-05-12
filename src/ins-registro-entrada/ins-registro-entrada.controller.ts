
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
    try {
      const { revisiones, observacion, lastPlacaInfo, odometro, placa } = body;
  
      // 1. Validación básica (sin romper el flujo existente)
      if (!lastPlacaInfo) {
        throw new BadRequestException('Se requiere lastPlacaInfo');
      }
  
      // 2. Validación "no intrusiva" del odómetro
      const odometroNum = parseFloat(odometro);
      if (placa && !isNaN(odometroNum)) {
        const validation = await this.validateOdometro(placa, odometroNum);
        if (!validation.valid) {
          console.warn(`Advertencia: Odómetro ${odometroNum} es menor al último registrado (${validation.lastOdometro})`);
          // No se rechaza, solo se registra la advertencia
        }
      }
  
      // 3. Procesamiento original garantizado
      return await this.processRegistroEntradaOriginal(
        revisiones,
        observacion,
        lastPlacaInfo,
        odometro
      );
  
    } catch (error) {
      console.error('Error en registro:', {
        error: error.message,
        stack: error.stack,
        body
      });
      throw new HttpException(
        error.message || 'Error procesando registro',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
