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
      danosCarroceria,
      cantidadLlantas // Nuevo campo recibido
    } = body;

    const estadoSalida = "salida";
    
    console.log("Datos recibidos - Llantas:", body.llantas);
    console.log("Cantidad de llantas recibida:", cantidadLlantas);

    let llantasArray: any[] = [];
    try {
      llantasArray = typeof body.llantas === 'string' 
        ? JSON.parse(body.llantas) 
        : body.llantas;
      
      if (!Array.isArray(llantasArray)) {
        throw new Error("Llantas no es un array válido");
      }

      // Validar que la cantidad de llantas coincida con lo esperado
      if (cantidadLlantas && llantasArray.length !== cantidadLlantas) {
        throw new Error(`La cantidad de llantas (${llantasArray.length}) no coincide con la esperada (${cantidadLlantas})`);
      }
    } catch (error) {
      console.error("Error al parsear llantas:", error);
      llantasArray = []; // Fallback seguro
    }

    console.log("Llantas procesadas (parsed):", llantasArray);

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
      danosCarroceria,
      cantidadLlantas // Pasamos la cantidad de llantas al servicio
    );

    return result;
  }
}
