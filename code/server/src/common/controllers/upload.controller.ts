import {
  BadRequestException,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RequirePermission } from '../decorators/require-permission.decorator';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post('image')
  @RequirePermission('renting:add', 'renting:edit', 'sale:add', 'sale:edit')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  uploadImage(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('请选择图片文件');
    if (!String(file.mimetype || '').startsWith('image/')) {
      throw new BadRequestException('仅支持图片文件');
    }
    // 开发环境直接返回 base64 占位 URL；生产环境应接入 OSS/S3
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return { url: base64 };
  }
}
