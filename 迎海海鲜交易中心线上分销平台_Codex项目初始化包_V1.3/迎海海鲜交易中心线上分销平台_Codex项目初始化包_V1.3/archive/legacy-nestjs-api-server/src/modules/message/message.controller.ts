import { Controller, Get, Param, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ok } from "../../shared/api-response";
import { RequestWithUser } from "../auth/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MessageService } from "./message.service";

@ApiTags("app-message")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("app/messages")
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get()
  @ApiOperation({ summary: "获取消息列表" })
  async list(@Req() request: RequestWithUser) {
    return ok(await this.messageService.list(request.user.id));
  }

  @Get("unread-count")
  @ApiOperation({ summary: "获取未读消息数" })
  async unreadCount(@Req() request: RequestWithUser) {
    return ok(await this.messageService.unreadCount(request.user.id));
  }

  @Get(":id")
  @ApiOperation({ summary: "获取消息详情" })
  async detail(@Req() request: RequestWithUser, @Param("id") id: string) {
    return ok(await this.messageService.detail(request.user.id, id));
  }

  @Put(":id/read")
  @ApiOperation({ summary: "标记单条消息已读" })
  async markRead(@Req() request: RequestWithUser, @Param("id") id: string) {
    return ok(await this.messageService.markRead(request.user.id, id));
  }

  @Put("read-all")
  @ApiOperation({ summary: "全部消息已读" })
  async markAllRead(@Req() request: RequestWithUser) {
    return ok(await this.messageService.markAllRead(request.user.id));
  }
}
