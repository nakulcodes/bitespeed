import { IsEmail, IsPhoneNumber, ValidateIf } from 'class-validator';

export class IdentifyContactDto {
  @ValidateIf((o) => !o.phoneNumber)
  @IsEmail()
  email: string;

  @ValidateIf((o) => !o.email)
  @IsPhoneNumber()
  phoneNumber: string;
}
