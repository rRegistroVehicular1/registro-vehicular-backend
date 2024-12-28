
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
  async register(
    @Body() body: any
  ) {

    const {revisiones, observacion, lastPlacaInfo, odometro } = body;
    const result = await this.insRegistroEntradaService.processRegistroEntrada(revisiones, observacion, lastPlacaInfo, odometro);
    return result;
  }
}

