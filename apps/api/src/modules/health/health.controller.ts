import { Controller, Get } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { HealthService, type HealthSnapshot } from "./health.service";

@Controller({ path: "healthz" })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  async getHealth(): Promise<HealthSnapshot> {
    return this.healthService.getHealth();
  }
}
