import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlacasModule } from './placas/placas.module';
import { InsRegistroSalidaModule } from './ins-registro-salida/ins-registro-salida.module';
import { HomeModule } from './home/home.module';
import { InsRegistroEntradaModule } from './ins-registro-entrada/ins-registro-entrada.module';
import { FallaModule } from './falla/falla.module';
import { SalidasModule } from './salidas/salidas.module';

@Module({
  imports: [PlacasModule, InsRegistroSalidaModule, HomeModule, InsRegistroEntradaModule, FallaModule, SalidasModule],
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService] 
})
export class AppModule {}
