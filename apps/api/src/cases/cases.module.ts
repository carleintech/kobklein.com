import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller';
import { CaseController } from './case.controller';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [CasesController, CaseController],
  providers: [AuditService],
})
export class CasesModule {}