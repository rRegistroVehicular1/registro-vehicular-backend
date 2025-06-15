import { Controller, Get, Header, Query } from '@nestjs/common';
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
  async getTiposVehiculo(@Query() params: any) {
      try {
          // Obtener tanto los tipos de vehículo como la cantidad de llantas
          const { tipos, llantas } = await this.placasService.getTiposVehiculo();
          
          return {
              success: true,
              tiposVehiculo: tipos,
              cantidadesLlantas: llantas
          };
      } catch (error) {
          console.error('Error en controller:', error);
          return {
              success: false,
              tiposVehiculo: {},
              cantidadesLlantas: {},
              message: 'Error al obtener tipos de vehículo y cantidades de llantas'
          };
      }
  }

  @Get('get-cantidad-llantas')
  async getCantidadLlantas(@Query('placa') placa: string) {
      try {
          if (!placa) {
              return {
                  success: false,
                  message: 'El parámetro "placa" es requerido',
                  cantidad: 4 // Valor por defecto
              };
          }

          const cantidad = await this.placasService.getCantidadLlantas(placa);
          return {
              success: true,
              placa: placa,
              cantidadLlantas: cantidad
          };
      } catch (error) {
          console.error('Error en controller:', error);
          return {
              success: false,
              placa: placa,
              cantidadLlantas: 4, // Valor por defecto en caso de error
              message: 'Error al obtener cantidad de llantas'
          };
      }
  }

  @Get('get-conductores')
  async getConductores() {
      try {
          const data = await this.placasService.getConductoresFromSheet();
          return {
              success: true,
              conductores: data
          };
      } catch (error) {
          console.error('Error en controller:', error);
          return {
              success: false,
              conductores: [],
              message: 'Error al obtener lista de conductores'
          };
      }
  }
}
