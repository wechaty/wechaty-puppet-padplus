import { ContactPayload, ContactGender, ContactType } from "wechaty-puppet";

export const convertToPuppetContact = (grpcContact: string): ContactPayload => {
  const result: ContactPayload = {
    id: '',
    gender: ContactGender.Male,
    type: ContactType.Personal,
    name: '',
    avatar: '',
    address: '',
    alias: '',
    city: '',
    friend: true,
    province: '',

  };
  return result;
}

