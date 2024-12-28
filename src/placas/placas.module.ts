import { forwardRef, Module } from '@nestjs/common';
import { PlacasService } from './placas.service';
import { PlacasController } from './placas.controller';
import { AppModule } from 'src/app.module';

@Module({
  imports: [forwardRef(() => AppModule)],
  controllers: [PlacasController],
  providers: [PlacasService],
})
export class PlacasModule { }
