import { forwardRef, Module } from '@nestjs/common';
import { InsRegistroEntradaService } from './ins-registro-entrada.service';
import { InsRegistroEntradaController } from './ins-registro-entrada.controller';
import { AppModule } from 'src/app.module';

@Module({
  imports: [forwardRef(() => AppModule)],
  controllers: [InsRegistroEntradaController],
  providers: [InsRegistroEntradaService],
})
export class InsRegistroEntradaModule { }
