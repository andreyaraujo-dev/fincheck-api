import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus
} from '@nestjs/common'
import { Request, Response } from 'express'
import { LoggerService } from '../services/logger/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggerService: LoggerService) {
    this.loggerService.setContext(HttpExceptionFilter.name)
  }

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const url = request?.url || ''
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR
    const error = exception instanceof Error ? exception.name : ''
    const message = this.getMessage(exception)
    const stack = exception instanceof Error ? exception.stack : ''

    if (!url.includes('robots') && !url.includes('.ico')) {
      this.loggerService.error(
        {
          statusCode: status,
          timestamp: new Date().toISOString(),
          path: request.url,
          error,
          message
        },
        stack
      )
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message
    })
  }

  private getMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse() || ''
      return response['message'] || response
    }
    if (exception instanceof Error) {
      return exception.message
    }
    return ''
  }
}