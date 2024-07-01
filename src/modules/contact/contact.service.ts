import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IdentifyContactDto } from './dto/create-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactEntity } from 'src/database/typeorm/entities/contact.entity';
import { In, Repository } from 'typeorm';
import { CONTACT_ENUM } from './dto/contact.enum';

@Injectable()
export class ContactService {
  private logger = new Logger(ContactService.name);
  constructor(
    @InjectRepository(ContactEntity)
    private readonly contactRepo: Repository<ContactEntity>,
  ) {}

  async identity(createContactDto: IdentifyContactDto) {
    try {
      let contactDetails: ContactEntity[] = [];
      let existsWithEmail: boolean = false;
      let existsWithPhone: boolean = false;

      if (createContactDto.email) {
        existsWithEmail = await this.contactRepo.exists({
          where: { email: createContactDto.email },
        });
      }
      if (createContactDto.phoneNumber) {
        existsWithPhone = await this.contactRepo.exists({
          where: { phone_number: createContactDto.phoneNumber },
        });
      }

      if (!existsWithEmail && !existsWithPhone) {
        //Handle if no contact is created
        contactDetails = [
          await this.contactRepo.save(
            this.contactRepo.create({
              email: createContactDto.email,
              phone_number: createContactDto.phoneNumber,
              linked_precedence: CONTACT_ENUM.PRIMARY,
            }),
          ),
        ];
        return { contact: this.formatResponse(contactDetails) };
      } else {
        contactDetails = await this.getContactData(
          contactDetails,
          createContactDto,
        );

        //Handle new value
        if (!existsWithEmail && createContactDto.email) {
          await this.updateContact(
            createContactDto.email,
            contactDetails[0].phone_number,
            CONTACT_ENUM.SECONDARY,
            contactDetails[0],
          );
        }
        if (!existsWithPhone && createContactDto.phoneNumber) {
          await this.updateContact(
            contactDetails[0].email,
            createContactDto.phoneNumber,
            CONTACT_ENUM.SECONDARY,
            contactDetails[0],
          );
        }

        //Handle conversion of primary to secondary
        const toUpdatePrimaryIds = [];
        contactDetails.map((contact, index) => {
          if (
            index != 0 &&
            contact.linked_precedence === CONTACT_ENUM.PRIMARY
          ) {
            toUpdatePrimaryIds.push(contact.id);
          }
        });
        if (toUpdatePrimaryIds.length > 0) {
          await this.contactRepo.update(
            { id: In(toUpdatePrimaryIds) },
            {
              linked_precedence: CONTACT_ENUM.SECONDARY,
              linked_id: contactDetails[0],
            },
          );
        }

        //Get Final Response
        contactDetails = [];
        contactDetails = await this.getContactData(
          contactDetails,
          createContactDto,
        );
        return { contact: this.formatResponse(contactDetails) };
      }
    } catch (error) {
      this.logger.error(error?.message, error?.stack);
      throw new InternalServerErrorException();
    }
  }

  private async getContactData(
    contactDetails: ContactEntity[],
    createContactDto: IdentifyContactDto,
  ) {
    contactDetails = await this.contactRepo.find({
      where: [
        {
          email: createContactDto?.email,
        },
        {
          phone_number: createContactDto.phoneNumber,
        },
      ],
      relations: { linked_id: true },
      select: { created_at: false, updated_at: false, deleted_at: false },
      order: { created_at: 'asc' },
    });
    if (contactDetails[0].linked_precedence === CONTACT_ENUM.PRIMARY) {
      const relatedContacts = await this.contactRepo.find({
        where: { linked_id: { id: contactDetails[0].id } },
      });

      const existingIds = new Set(contactDetails.map((c) => c.id));

      const uniqueRelatedContacts = relatedContacts.filter(
        (c) => !existingIds.has(c.id),
      );

      contactDetails = [...contactDetails, ...uniqueRelatedContacts];
    }
    const newDataArray = [];
    contactDetails.map((c) => {
      if (
        c.linked_id &&
        c.linked_id.id &&
        !contactDetails.includes(c.linked_id)
      ) {
        newDataArray.push(c.linked_id);
      }
    });
    contactDetails = [...contactDetails, ...newDataArray];
    contactDetails.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return contactDetails;
  }

  private async updateContact(
    email: string,
    phoneNumber: string,
    linkedPrecedence: CONTACT_ENUM.SECONDARY | CONTACT_ENUM.PRIMARY,
    linkedId: ContactEntity,
  ) {
    await this.contactRepo.save(
      this.contactRepo.create({
        email: email,
        phone_number: phoneNumber,
        linked_precedence: linkedPrecedence,
        linked_id: linkedId,
      }),
    );
  }

  private formatResponse(contacts: ContactEntity[]) {
    let primaryContactId = null;
    const secondaryContactIds = [];
    const emailSet = new Set();
    const phoneSet = new Set();
    contacts.forEach((contact) => {
      if (
        contact.linked_precedence === CONTACT_ENUM.PRIMARY &&
        !primaryContactId
      ) {
        primaryContactId = contact.id;
      } else if (contact.linked_precedence === CONTACT_ENUM.SECONDARY) {
        secondaryContactIds.push(contact.id);
      }
      emailSet.add(contact.email);
      phoneSet.add(contact.phone_number);
    });
    const emails = Array.from(emailSet);
    const phoneNumbers = Array.from(phoneSet);
    return {
      primaryContactId,
      email: emails,
      phoneNumbers,
      secondaryContactIds,
    };
  }
}
