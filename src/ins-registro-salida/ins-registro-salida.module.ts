import { forwardRef, Module } from '@nestjs/common';
import { InsRegistroSalidaService } from './ins-registro-salida.service';
import { InsRegistroSalidaController } from './ins-registro-salida.controller';
import { AppModule } from 'src/app.module';
import { SalidasModule } from 'src/salidas/salidas.module';
import { PlacasModule } from '../placas/placas.module';

@Module({
  imports: [
    forwardRef(() => AppModule),
    forwardRef(() => SalidasModule),
    forwardRef(() => PlacasModule)
  ],
  controllers: [InsRegistroSalidaController],
  providers: [InsRegistroSalidaService],
})
export class InsRegistroSalidaModule {}
