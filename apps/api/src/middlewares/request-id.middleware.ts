import { Injectable, NestMiddleware } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const incoming = req.headers["x-request-id"];
    const id = incoming ? String(incoming) : uuidv4();

    req.requestId = id;
    res.setHeader("x-request-id", id);

    next();
  }
}
