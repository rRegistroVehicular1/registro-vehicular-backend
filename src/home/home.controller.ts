import { Controller, Post, Body } from '@nestjs/common';
import { HomeService } from './home.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("home")
@Controller('home')
export class HomeController {

  constructor(private readonly homeService: HomeService) { }

  @Post('register-placa')
  async registerPlaca(@Body() body: any) {
    const { placa } = body;
    const result = await this.homeService.checkPlaca(placa);
    return result;
  }
}
