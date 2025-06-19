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
    
    // Procesamiento seguro de llantas
    let llantasArray: any[] = [];
    try {
      llantasArray = typeof body.llantas === 'string' 
        ? JSON.parse(body.llantas) 
        : body.llantas;
      
      if (!Array.isArray(llantasArray)) {
        throw new Error("Llantas no es un array válido");
      }
    } catch (error) {
      console.error("Error al parsear llantas:", error);
      llantasArray = []; // Fallback seguro
    }

    console.log("Llantas procesadas (parsed):", llantasArray);

    // Obtener cantidad de llantas esperadas para esta placa
    let cantidadLlantasEsperadas = 4; // Valor por defecto
    try {
      const response = await this.InsRegistroSalidaService.getCantidadLlantas(placa);
      cantidadLlantasEsperadas = response?.cantidad || 4;
    } catch (error) {
      console.error("Error al obtener cantidad de llantas:", error);
    }

    // Validar que coincida la cantidad de llantas
    if (llantasArray.length !== cantidadLlantasEsperadas) {
      throw new Error(`La placa ${placa} requiere ${cantidadLlantasEsperadas} llantas, pero se enviaron ${llantasArray.length}`);
    }

    const result = await this.InsRegistroSalidaService.handleData(
      placa,
      conductor,
      sucursal,
      tipoVehiculo,
      odometroSalida,
      estadoSalida, 
      llantasArray,
      observacionGeneralLlantas,
      fluidos,
      observacionGeneralFluido,
      parametrosVisuales,
      observacionGeneralVisuales,
      luces,
      insumos,
      documentacion,
      danosCarroceria,
      cantidadLlantasEsperadas // Pasamos la cantidad esperada al servicio
    );

    return result;
  }
}
