
import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InsRegistroEntradaService } from './ins-registro-entrada.service';
import { FileInterceptor } from '@nestjs/platform-express';

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
  async register(
    @Body() body: any
  ) {

    const {revisiones, observacion, lastPlacaInfo, odometro, placa } = body;

    const lastOdometro = await this.insRegistroEntradaService.getLastOdometro(placa);
    if (parseFloat(odometro) <= lastOdometro) {
      throw new BadRequestException(`El odómetro debe ser mayor al último registrado (${lastOdometro})`);
    }
    const result = await this.insRegistroEntradaService.processRegistroEntrada(revisiones, observacion, lastPlacaInfo, odometro);
    return result;
  }
}
