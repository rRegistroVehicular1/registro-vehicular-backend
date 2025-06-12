import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InsRegistroSalidaService } from './ins-registro-salida.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags("ins-registro-salida")
@Controller('ins-registro-salida')
export class InsRegistroSalidaController {
  constructor(private readonly InsRegistroSalidaService: InsRegistroSalidaService) { }

  @Post('register')
  @UseInterceptors(FileInterceptor('documento'))
  async register(@Body() body: any) {
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
      cantidadLlantas
    } = body;

    const estadoSalida = "salida";
    
    // Validación y normalización de llantas
    let llantasArray: any[] = [];
    try {
      // Parsear llantas si vienen como string
      llantasArray = typeof body.llantas === 'string' 
        ? JSON.parse(body.llantas) 
        : body.llantas;
      
      if (!Array.isArray(llantasArray)) {
        throw new Error("Llantas no es un array válido");
      }

      // Validar que la cantidad de llantas coincida con la configuración
      const cantidadEsperada = cantidadLlantas || 4;
      if (![4, 6, 10].includes(cantidadEsperada)) {
        throw new Error(`Cantidad de llantas inválida: ${cantidadEsperada}. Debe ser 4, 6 o 10.`);
      }

      // Validar IDs de llantas según cantidad
      const idsPermitidos = this.getIdsPermitidos(cantidadEsperada);
      const idsInvalidos = llantasArray
        .map(llanta => llanta?.id)
        .filter(id => !idsPermitidos.includes(id));
      
      if (idsInvalidos.length > 0) {
        throw new Error(`Configuración de ${cantidadEsperada} llantas no permite IDs: ${idsInvalidos.join(', ')}`);
      }
    } catch (error) {
      console.error("Error al procesar llantas:", error);
      throw new Error(`Error en datos de llantas: ${error.message}`);
    }

    console.log("Llantas procesadas:", llantasArray.length, "items");
    
    try {
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
        cantidadLlantas
      );

      return result;
    } catch (error) {
      console.error('Error en el controlador:', error);
      throw error;
    }
  }

  private getIdsPermitidos(cantidadLlantas: number): number[] {
    switch(cantidadLlantas) {
      case 4:
        return [1, 2, 5, 7]; // Delantera izq/der, Trasera der/izq
      case 6:
        return [1, 2, 5, 6, 7, 8]; // Delantera + Trasera + Extras
      case 10:
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Todas las posiciones
      default:
        return [1, 2, 5, 7]; // Default a 4 llantas
    }
  }
}
