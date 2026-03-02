import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CognitoService } from './cognito.service';

describe('CognitoService', () => {
  let service: CognitoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CognitoService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CognitoService>(CognitoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
