import { Injectable } from '@nestjs/common';
import { IdentifyContactDto } from './dto/create-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactEntity } from 'src/database/typeorm/entities/contact.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactEntity)
    private readonly contactRepo: Repository<ContactEntity>,
  ) {}

  async identity(createContactDto: IdentifyContactDto) {
    let contactDetails: ContactEntity[];

    contactDetails = await this.contactRepo.find({
      where: [
        {
          email: createContactDto?.email,
          phone_number: createContactDto.phoneNumber,
        },
      ],
      order: { created_at: 'asc' },
    });


    //Handle if not contact is created
    if (contactDetails.length === 0) {
      contactDetails = [
        await this.contactRepo.save(
          this.contactRepo.create({
            email: createContactDto.email,
            phone_number: createContactDto.phoneNumber,
            linked_precedence: 'primary',
          }),
        ),
      ];
    }

    let foundEmails = contactDetails.map((contact) => contact.email);
    let foundPhoneNumber = contactDetails.map(
      (contact) => contact.phone_number,
    );

    // if (
    //   !foundEmails.includes(createContactDto.email) ||
    //   !foundPhoneNumber.includes(createContactDto.phoneNumber)
    // ) {
    //   await this.contactRepo.save(
    //     this.contactRepo.create({
    //       email: createContactDto.email,
    //       phone_number: createContactDto.phoneNumber,
    //       linked_precedence: 'secondary',
    //       linked_id: contactDetails,
    //     }),
    //   );
    // }


    const contactsToUpdate = contactDetails.filter(contact => contact.linked_precedence !== 'secondary');
    return { contact: this.formatResponse(contactDetails) };
  }

  formatResponse(contacts: ContactEntity[]) {
    let primaryContactId = null;
    let secondaryContactIds = [];
    let emailSet = new Set();
    let phoneSet = new Set();
    contacts.forEach((contact) => {
      if (contact.linked_precedence === 'primary' && !primaryContactId) {
        primaryContactId = contact.id;
      } else if (contact.linked_precedence === 'secondary') {
        secondaryContactIds.push(contact.id);
      }
      emailSet.add(contact.email);
      phoneSet.add(contact.phone_number);
    });
    let emails = Array.from(emailSet);
    let phoneNumbers = Array.from(phoneSet);
    return {
      primaryContactId,
      email: emails,
      phoneNumbers,
      secondaryContactIds,
    };
  }
}
