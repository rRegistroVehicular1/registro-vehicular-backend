import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SalidasService } from './salidas.service';

@ApiTags("salidas")
@Controller('salidas')
export class SalidasController {

    constructor(private readonly salidasService: SalidasService) { }

    @Post('registrar-alerta')
    async registrarAlerta(@Body() body: any) {
        const { placa, conductor, fechaSalida, sucursal, horaSalida, alerta } = body;

        const result = await this.salidasService.handleDataSalida(placa, conductor, fechaSalida, sucursal, horaSalida, alerta);

        return result;
    }

    @Get('get-salidas')
    async getDataSalidas() {
        const data = await this.salidasService.getDataSalidas();
        return data;
    }


}
