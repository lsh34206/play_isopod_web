import { IsString, IsEnum, IsOptional, MaxLength, MinLength } from 'class-validator';
import { IsopodSpecies } from '../schemas/isopod.schema';

export class CreateIsopodDto {
  @IsString()
  @MinLength(1, { message: '이름을 입력해주세요.' })
  @MaxLength(30, { message: '이름은 최대 30자까지 가능합니다.' })
  name: string;

  @IsOptional()
  @IsEnum(IsopodSpecies, {
    message: '유효한 종류를 선택해주세요. (armadillidium/porcellio/cubaris)',
  })
  species?: string;
}
