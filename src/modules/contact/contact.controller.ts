import { Controller, Post, Body } from '@nestjs/common';
import { ContactService } from './contact.service';
import { IdentifyContactDto } from './dto/create-contact.dto';

@Controller('identify')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  identify(@Body() identifyContactDto: IdentifyContactDto) {
    return this.contactService.identity(identifyContactDto);
  }
}
