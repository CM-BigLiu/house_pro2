import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const message = this.normalizeMessage(rawMessage);

    response.status(status).json({
      code: status,
      message,
      data: null,
    });
  }

  private normalizeMessage(raw: string | Record<string, any>): string {
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object') {
      if (Array.isArray(raw.message)) return raw.message.join('; ');
      if (typeof raw.message === 'string') return raw.message;
      if (typeof raw.error === 'string') return raw.error;
    }
    return '服务器内部错误';
  }
}
