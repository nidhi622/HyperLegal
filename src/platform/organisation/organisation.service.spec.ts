import { Test, TestingModule } from '@nestjs/testing';
import { CognitoService } from 'src/cognito/cognito.service';
import { PrismaService } from 'src/database/prisma.service';
import { OrganisationService } from './organisation.service';

describe('OrganisationService', () => {
  let service: OrganisationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganisationService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: CognitoService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<OrganisationService>(OrganisationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
