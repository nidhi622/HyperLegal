// import {HttpStatus} from "@nestjs/common";

// export class ApiResponse
// {
//     statusCode: number = HttpStatus.OK;
//     message: string;
//     error: any = null;
//     data: object = [];
// }



// {
//     // status:string  = "success" | "failed";
//     success :boolean (ture|false)
//     message: string;
//     error: any = null;   {message,data,code}
//     data: object = [];
// }
import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ApiResponse<T = any> {
  @ApiProperty({ example: 200 })
  statusCode: number = HttpStatus.OK;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty({ example: null, nullable: true })
  error: any = null;

  @ApiProperty()
  data: T | T[] = [] as any;

  constructor(message: string, data?: T, statusCode: number = HttpStatus.OK) {
    this.message = message;
    this.data = data ?? ([] as any);
    this.statusCode = statusCode;
  }
}
