import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateIsopodDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  humidity?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(40)
  temperature?: number;
}

export class CareIsopodDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  targetHumidity?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(40)
  targetTemperature?: number;
}
