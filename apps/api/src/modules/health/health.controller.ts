import { Controller, Get, Version } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { HealthService, type HealthSnapshot } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @Version("1")
  async getHealth(): Promise<HealthSnapshot> {
    return this.healthService.getHealth();
  }

  // Legacy endpoint untuk backward compatibility
  @Get()
  @Public()
  @Version([""])
  async getHealthLegacy(): Promise<HealthSnapshot> {
    return this.healthService.getHealth();
  }
}
