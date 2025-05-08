
import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InsRegistroEntradaService } from './ins-registro-entrada.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('ins-registro-entrada')
@Controller('ins-registro-entrada')
export class InsRegistroEntradaController {
  constructor(private readonly insRegistroEntradaService: InsRegistroEntradaService) { }

  @Post('register')
  @UseInterceptors(FileInterceptor('documento'))
  async register(@Body() body: any) {
    try{
      const {revisiones, observacion, lastPlacaInfo, odometro } = body;
      const result = await this.insRegistroEntradaService.processRegistroEntrada(revisiones, observacion, lastPlacaInfo, odometro);
      return result;
    } catch (error){
      // Captura específicamente el error de validación
      if (error.message.startsWith('VALIDACION_ODOMETRO')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }
  
}

