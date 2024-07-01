import { Column, Entity, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../abstract.entity';

@Entity({ name: 'tbl_contact' })
export class ContactEntity extends AbstractEntity {
  @Column({nullable:true})
  phone_number: string;

  @Column({nullable:true})
  email: string;

  @ManyToOne(() => ContactEntity, (contact) => contact.id)
  linked_id: ContactEntity;

  @Column()
  linked_precedence: 'secondary' | 'primary';
}
