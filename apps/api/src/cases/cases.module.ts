import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller';
import { CaseController } from './case.controller';

@Module({
  controllers: [CasesController, CaseController],
})
export class CasesModule {}