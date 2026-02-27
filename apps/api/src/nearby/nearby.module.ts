import { Module } from "@nestjs/common";
import { NearbyController } from "./nearby.controller";

@Module({
  controllers: [NearbyController],
})
export class NearbyModule {}
