import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: any) {
    // 开发环境直接返回 base64 占位 URL；生产环境应接入 OSS/S3
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return { url: base64 };
  }
}
