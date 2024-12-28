import { forwardRef, Module } from '@nestjs/common';
import { InsRegistroSalidaService } from './ins-registro-salida.service';
import { InsRegistroSalidaController } from './ins-registro-salida.controller';
import { AppModule } from 'src/app.module';
import { SalidasModule } from 'src/salidas/salidas.module';

@Module({
  imports: [forwardRef(() => AppModule),SalidasModule],
  controllers: [InsRegistroSalidaController],
  providers: [InsRegistroSalidaService],
})
export class InsRegistroSalidaModule {}
