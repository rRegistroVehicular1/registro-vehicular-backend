import { Controller, Get } from '@nestjs/common';
import { PlacasService } from './placas.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("placas")
@Controller('placas')
export class PlacasController {
  constructor(private readonly placasService: PlacasService) { }

  @Get('get-data-placas')
  @Header('Access-Control-Allow-Origin', '*')
  async getData() {
    const data = await this.placasService.getPlacasFromSheet();
    return data;
  } catch (error) {
    console.error('Error en controller:', error);
    return []; // Siempre devuelve array aunque falle
  }
}
