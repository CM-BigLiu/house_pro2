import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseWrapper<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseWrapper<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseWrapper<T>> {
    return next.handle().pipe(
      map((data) => {
        // 已经是统一格式或流式响应时不二次包装
        if (
          data &&
          typeof data === 'object' &&
          'code' in data &&
          'data' in data
        ) {
          return (data as unknown) as ResponseWrapper<T>;
        }

        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode || 200;
        // 业务成功码统一用 200，与前端 request.ts 拦截器保持一致
        return {
          code: statusCode >= 200 && statusCode < 300 ? 200 : statusCode,
          message: 'success',
          data,
        };
      }),
    );
  }
}
