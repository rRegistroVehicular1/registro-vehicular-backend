import { Controller, Get, Header } from '@nestjs/common';
import { PlacasService } from './placas.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("placas")
@Controller('placas')
export class PlacasController {
  constructor(private readonly placasService: PlacasService) { }

  @Get('get-data-placas')
  async getData() {
    try {
      const data = await this.placasService.getPlacasFromSheet();
      return data;
    } catch (error) {
      console.error('Error en controller:', error);
      return []; // Siempre devuelve array aunque falle
    }
  }

  @Get('get-vehiculos')
  async getVehiculos() {
      try {
          const data = await this.placasService.getVehiculosFromSheet();
          return data;
      } catch (error) {
          console.error('Error en controller:', error);
          return {};
      }
  }

  @Get('get-tipos-vehiculo')
  async getTiposVehiculo() {
      try {
          const data = await this.placasService.getTiposVehiculo();
          return data;
      } catch (error) {
          console.error('Error en controller:', error);
          return {};
      }
  }
}
