import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors } from '@nestjs/common';
import { FallaService } from './falla.service';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags("registro-falla")
@Controller('registro-falla')
export class FallaController {
  constructor(private readonly fallaService: FallaService) { }

  @Post('register')
  @UseInterceptors(FileInterceptor('documento'))
  async register(
    @Body() body: any
  ) {

    const { sucursal, fecha, conductor, vehiculo, placa, detalles } = body;
    const result = await this.fallaService.processRegistroFalla(sucursal, fecha, conductor, vehiculo, placa, detalles);

    return result;
  }

}
