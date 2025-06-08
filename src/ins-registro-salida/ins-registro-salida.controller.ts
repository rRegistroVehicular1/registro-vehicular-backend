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
      cantidadLlantas, // Nueva propiedad recibida desde el frontend
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
    
    // Validación de la cantidad de llantas
    const cantidadValidada = this.validarCantidadLlantas(cantidadLlantas);
    
    console.log("Datos recibidos - Cantidad de llantas:", cantidadValidada);
    console.log("Datos recibidos - Llantas:", body.llantas);

    let llantasArray: any[] = [];
    try {
      llantasArray = typeof body.llantas === 'string' 
        ? JSON.parse(body.llantas) 
        : body.llantas;
      
      if (!Array.isArray(llantasArray)) {
        throw new Error("Llantas no es un array válido");
      }

      // Validar que la cantidad de llantas coincida con la configuración
      this.validarConfiguracionLlantas(llantasArray, cantidadValidada);

    } catch (error) {
      console.error("Error al parsear llantas:", error);
      llantasArray = [];
    }

    console.log("Llantas procesadas (parsed):", llantasArray);

    const result = await this.InsRegistroSalidaService.handleData(
      placa,
      conductor,
      sucursal,
      tipoVehiculo,
      odometroSalida,
      estadoSalida,
      llantasArray,
      cantidadValidada, // Pasamos la cantidad validada
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

  private validarCantidadLlantas(cantidad: any): number {
    const cant = parseInt(cantidad);
    if ([4, 6, 10].includes(cant)) {
      return cant;
    }
    console.warn(`Cantidad de llantas inválida: ${cantidad}. Usando valor por defecto 4`);
    return 4;
  }

  private validarConfiguracionLlantas(llantas: any[], cantidad: number): void {
    const configuracionesValidas = {
      4: [1, 2, 5, 7],    // IDs para 4 llantas
      6: [1, 2, 5, 6, 7, 8], // IDs para 6 llantas
      10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // IDs para 10 llantas
    };

    const idsPermitidos = configuracionesValidas[cantidad] || configuracionesValidas[4];
    const idsRecibidos = llantas.map(l => l.id).filter(id => id !== undefined);

    const idsInvalidos = idsRecibidos.filter(id => !idsPermitidos.includes(id));
    
    if (idsInvalidos.length > 0) {
      console.error(`Configuración inválida de llantas. Cantidad: ${cantidad}, IDs inválidos: ${idsInvalidos.join(', ')}`);
      throw new Error(`Configuración de llantas no coincide con la cantidad especificada (${cantidad})`);
    }
  }
}
