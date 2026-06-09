import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3, { message: '사용자명은 최소 3자 이상이어야 합니다.' })
  @MaxLength(20, { message: '사용자명은 최대 20자까지 가능합니다.' })
  username: string;

  @IsEmail({}, { message: '유효한 이메일 주소를 입력하세요.' })
  email: string;

  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  @MaxLength(50, { message: '비밀번호는 최대 50자까지 가능합니다.' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '닉네임은 최대 100자까지 가능합니다.' })
  displayName?: string;
}
