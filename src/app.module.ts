import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClinicManagementModule } from './clinic-management/clinic-management.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/medaichain'),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'votre-secret-jwt-super-secure-changez-moi',
      signOptions: { expiresIn: '7d' },
    }),
    ClinicManagementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
