import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { InsRegistroSalidaService } from './ins-registro-salida.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags("ins-registro-salida")
@Controller('ins-registro-salida')
export class InsRegistroSalidaController {
  constructor(
    private readonly insRegistroSalidaService: InsRegistroSalidaService
  ) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('documento'))
  @ApiBody({
    description: 'Datos de inspección de salida',
    schema: {
      type: 'object',
      properties: {
        placa: { type: 'string' },
        conductor: { type: 'string' },
        sucursal: { type: 'string' },
        tipoVehiculo: { type: 'string' },
        odometroSalida: { type: 'string' },
        llantas: { type: 'array' },
        cantidadLlantas: { type: 'number', enum: [4, 6, 10] },
        observacionGeneralLlantas: { type: 'string' },
        fluidos: { type: 'array' },
        observacionGeneralFluido: { type: 'string' },
        parametrosVisuales: { type: 'array' },
        observacionGeneralVisuales: { type: 'string' },
        luces: { type: 'array' },
        insumos: { type: 'array' },
        documentacion: { type: 'array' },
        danosCarroceria: { type: 'array' }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Inspección registrada correctamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        cantidadLlantas: { type: 'number' },
        placa: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async register(@Body() body: any) {
    const {
      placa,
      conductor,
      sucursal,
      tipoVehiculo,
      odometroSalida,
      llantas,
      cantidadLlantas,
      observacionGeneralLlantas,
      fluidos,
      observacionGeneralFluido,
      parametrosVisuales,
      observacionGeneralVisuales,
      luces,
      insumos,
      documentacion,
      danosCarroceria
    } = body;

    try {
      const result = await this.insRegistroSalidaService.handleData(
        placa,
        conductor,
        sucursal,
        tipoVehiculo,
        odometroSalida,
        "salida",
        llantas,
        cantidadLlantas,
        observacionGeneralLlantas,
        fluidos,
        observacionGeneralFluido,
        parametrosVisuales,
        observacionGeneralVisuales,
        luces,
        insumos,
        documentacion,
        danosCarroceria
      );

      return result;
    } catch (error) {
      throw error;
    }
  }
}
