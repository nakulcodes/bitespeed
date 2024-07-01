import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { OrganizationEntity } from './entities/organization.entity';
import { ProviderEntity } from './entities/provider.entity';
import { ReviewResponseEntity } from './entities/review-response.entity';
import { ReviewEntity } from './entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<any>('PG_TYPE'),
        host: configService.get<string>('PG_HOST'),
        port: parseInt(configService.get<string>('PG_PORT')),
        username: configService.get<string>('PG_USERNAME'),
        password: configService.get<string>('PG_PASS'),
        database: configService.get<string>('PG_DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        // synchronize: configService.get<boolean>('PG_SYNCHRONIZE'),
        entities: [
          UserEntity,
          OrganizationEntity,
          ProviderEntity,
          ReviewResponseEntity,
          ReviewEntity,
        ],
      }),
      inject: [ConfigService],
    }),
  ],
})
export class CustomTypeOrmModule {}
