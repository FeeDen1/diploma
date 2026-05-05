import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { TasksModule } from './tasks/tasks.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { PrismaModule } from './prisma';
import { S3Module } from './s3/s3.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    S3Module,
    UsersModule,
    AuthModule,
    GroupsModule,
    TasksModule,
    SubmissionsModule,
    FilesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
