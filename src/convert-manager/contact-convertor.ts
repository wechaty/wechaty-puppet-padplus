import { ContactPayload } from "wechaty-puppet";

export const convertToPuppetContact = (grpcContact: string):ContactPayload => {
  return new ContactPayload();
}