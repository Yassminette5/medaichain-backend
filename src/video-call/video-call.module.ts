import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoCallController } from './video-call.controller';
import { VideoCallService } from './video-call.service';

@Module({
  imports: [ConfigModule],
  controllers: [VideoCallController],
  providers: [VideoCallService],
  exports: [VideoCallService],
})
export class VideoCallModule {}
