import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsArray, ValidateNested, IsObject, Min } from 'class-validator';
import { Type } from 'class-transformer';

class SortDto {
  @ApiProperty({ example: 'createdAt' })
  @IsString()
  field: string;

  @ApiProperty({ example: 'desc', enum: ['asc', 'desc'] })
  @IsString()
  dir: 'asc' | 'desc';
}

class FilterDto {
  @ApiProperty({ example: 'name' })
  @IsString()
  field: string;

  @ApiProperty({ example: 'contains' })
  @IsString()
  operator: string;

  @ApiProperty({ example: 'string' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'john' })
  @IsString()
  value: any;
}

class SearchDto {
  @ApiProperty({ example: '' })
  @IsString()
  @IsOptional()
  value: string;
}

export class FindAllOrganisationsDto {
  @ApiProperty({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({ example: 10, default: 10 })
  @IsInt()
  @Min(1)
  take: number;

  @ApiProperty({ example: 0, default: 0 })
  @IsInt()
  @Min(0)
  skip: number;

  @ApiProperty({ type: SortDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SortDto)
  sort: SortDto;

  @ApiProperty({ type: [FilterDto], required: false })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FilterDto)
  filters?: FilterDto[];

  @ApiProperty({ type: SearchDto })
  @IsObject()
  @ValidateNested()
  @Type(() => SearchDto)
  search: SearchDto;
}