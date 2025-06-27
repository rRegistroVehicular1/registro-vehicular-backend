import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { InsRegistroSalidaService } from './ins-registro-salida.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("ins-registro-salida")
@Controller('ins-registro-salida')
export class InsRegistroSalidaController {
  constructor(private readonly InsRegistroSalidaService: InsRegistroSalidaService) { }

  @Post('register')
  @UseInterceptors(FileInterceptor('documento'))
  async register(
    @Body() body: any
  ) {
    const {
      placa,
      conductor,
      sucursal,
      tipoVehiculo,
      odometroSalida,
      llantas,
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

    const estadoSalida = "salida";

    // Procesamiento seguro del conductor
    let conductorFinal = conductor;
    if (typeof conductor === 'object') {
      // Si es un objeto (puede ser del campo personalizado), extraemos el valor
      conductorFinal = conductor.value || conductor.nombre || '';
    }
    
    // Procesamiento seguro de llantas
    let llantasArray: any[] = [];
    try {
      llantasArray = typeof body.llantas === 'string' 
        ? JSON.parse(body.llantas) 
        : body.llantas;
      
      if (!Array.isArray(llantasArray)) {
        throw new Error("Llantas no es un array válido");
      }

      // Validar que las llantas tengan ID y sean válidas
      llantasArray.forEach(llanta => {
        if (!llanta.id || typeof llanta.id !== 'number') {
          throw new Error(`Llanta inválida: ${JSON.stringify(llanta)}`);
        }
      });
    } catch (error) {
      console.error("Error al procesar llantas:", error);
      throw new Error(`Error en formato de llantas: ${error.message}`);
    }

    console.log("Llantas procesadas:", llantasArray);

    const result = await this.InsRegistroSalidaService.handleData(
      placa,
      conductorFinal,
      sucursal,
      tipoVehiculo,
      odometroSalida,
      estadoSalida, 
      llantasArray, // Enviamos el array procesado
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
  }
}
