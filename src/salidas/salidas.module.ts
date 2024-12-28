import { forwardRef, Module } from '@nestjs/common';
import { SalidasService } from './salidas.service';
import { SalidasController } from './salidas.controller';
import { AppModule } from 'src/app.module';

@Module({
  imports: [forwardRef(() => AppModule)],
  controllers: [SalidasController],
  providers: [SalidasService],
  exports:[SalidasService]
})
export class SalidasModule {}
