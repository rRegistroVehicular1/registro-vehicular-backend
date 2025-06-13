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
    
    // Validación y parseo de llantas
    let llantasArray: any[] = [];
    try {
      llantasArray = typeof body.llantas === 'string' 
        ? JSON.parse(body.llantas) 
        : body.llantas;
      
      if (!Array.isArray(llantasArray)) {
        throw new Error("Llantas no es un array válido");
      }

      // Validar que las llantas coincidan con la cantidad esperada
      const cantidadLlantas = llantasArray.length;
      if (![4, 6, 10].includes(cantidadLlantas)) {
        throw new Error(`Cantidad de llantas inválida: ${cantidadLlantas}. Debe ser 4, 6 o 10.`);
      }
    } catch (error) {
      console.error("Error al procesar llantas:", error);
      throw new Error(`Error en datos de llantas: ${error.message}`);
    }

    console.log("Llantas procesadas:", llantasArray.length, "items"); // Debug
    
    const todasLlantas = [...llantasArray];

    const result = await this.InsRegistroSalidaService.handleData(
      placa,
      conductor,
      sucursal,
      tipoVehiculo,
      odometroSalida,
      estadoSalida, 
      todasLlantas,
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
