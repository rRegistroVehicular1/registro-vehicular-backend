import { forwardRef, Module } from '@nestjs/common';
import { FallaService } from './falla.service';
import { FallaController } from './falla.controller';
import { AppModule } from 'src/app.module';

@Module({
  imports: [forwardRef(() => AppModule)],
  controllers: [FallaController],
  providers: [FallaService],
})
export class FallaModule {}
