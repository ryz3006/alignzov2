import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presigned-url')
  @ApiOperation({ summary: 'Get a pre-signed URL for file uploads' })
  getPresignedUrl(@Body('fileName') fileName: string) {
    return this.uploadsService.getPresignedUrl(fileName);
  }
}
