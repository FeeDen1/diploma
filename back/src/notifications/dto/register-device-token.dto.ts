import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches, MaxLength } from 'class-validator';
import { DevicePlatform } from '../../../generated/prisma/client';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    description: 'Expo Push Token, полученный на клиенте',
  })
  @IsString()
  @MaxLength(255)
  @Matches(/^ExponentPushToken\[.+\]$/, {
    message: 'Невалидный формат Expo Push Token',
  })
  readonly token: string;

  @ApiProperty({ enum: DevicePlatform })
  @IsEnum(DevicePlatform, { message: 'Платформа должна быть ios или android' })
  readonly platform: DevicePlatform;
}
