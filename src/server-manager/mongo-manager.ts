import mongoose from 'mongoose'

import { log } from 'wechaty-puppet'
import {
  FriendshipPayload,
  PadplusContactPayload,
  PadplusRoomMemberMap,
  PadplusRoomPayload,
  PadplusRoomInvitationPayload,
} from '../schemas'

const Schema = mongoose.Schema

const contactSchema = new Schema({
  alias            : String,
  bigHeadUrl       : String,
  city             : String,
  contactFlag      : Number,
  contactType      : Number,
  country          : String,
  labelLists       : String,
  nickName         : String,
  province         : String,
  remark           : String,
  sex              : Number,
  signature        : String,
  smallHeadUrl     : String,
  stranger         : String,
  ticket           : String,
  uniqueKey        : {
    index: true,
    type: String,
  },
  userName         : String,
  verifyFlag       : Number,
}, {
  timestamps: true,
  validateBeforeSave: false,
  versionKey: false,
})

const roomSchema = new Schema({
  alias          : String,
  bigHeadUrl     : String,
  chatRoomOwner  : String,
  chatroomId     : String,
  chatroomVersion: Number,
  contactType    : Number,
  isDelete       : Boolean,
  labelLists     : String,
  memberCount    : Number,
  members        : [{
    NickName: String,
    UserName : String,
  }],
  nickName       : String,
  smallHeadUrl   : String,
  stranger       : String,
  ticket         : String,
  uniqueKey      : {
    index: true,
    type: String,
  },
}, {
  timestamps: true,
  validateBeforeSave: false,
  versionKey: false,
})

const roomMemberSchema = new Schema({
  bigHeadUrl: String,
  chatroomId: String,
  contactId: String,
  displayName: String,
  inviterId: String,
  nickName: String,
  smallHeadUrl: String,
  uniqueKey: {
    index: true,
    type: String,
  },
}, {
  timestamps: true,
  validateBeforeSave: false,
  versionKey: false,
})

const friendshipSchema = new Schema({
  contactId: String,
  hello: String,
  id: String,
  stranger: String,
  ticket: String,
  timestamp: Number,
  type: Number,
  uniqueKey: {
    index: true,
    type: String,
  },
}, {
  timestamps: true,
  validateBeforeSave: false,
  versionKey: false,
})

const roomInvitationSchema = new Schema({
  fromUser : String,
  id       : String,
  roomName : String,
  timestamp: Number,
  uniqueKey: {
    index: true,
    type: String,
  },
  url      : String,
}, {
  timestamps: true,
  validateBeforeSave: false,
  versionKey: false,
})

const PRE = 'MongoManager'

export class MongoManager {

  private Contact: mongoose.Model<mongoose.Document>
  private Room: mongoose.Model<mongoose.Document>
  private RoomMember: mongoose.Model<mongoose.Document>
  private Friendship: mongoose.Model<mongoose.Document>
  private RoomInvitation: mongoose.Model<mongoose.Document>
  private db?: mongoose.Connection
  constructor (private userName: string) {
    this.Contact = mongoose.model('Contact', contactSchema)
    this.Room = mongoose.model('Room', roomSchema)
    this.RoomMember = mongoose.model('RoomMember', roomMemberSchema)
    this.Friendship = mongoose.model('Friendship', friendshipSchema)
    this.RoomInvitation = mongoose.model('RoomInvitation', roomInvitationSchema)
  }

  public async init (mongoUrl: string) {
    log.silly(PRE, `Mongo init()`)

    await mongoose.connect(mongoUrl, {
      server: { poolSize: 30 },
      useNewUrlParser: true,
    })

    this.db = mongoose.connection
    this.db.on('error', () => log.error('connection error'))
    this.db.once('open', () => {
      log.info(`Connected successfully!`)
    })
  }

  public async release () {
    log.silly(PRE, `Close mongo connection`)
    if (!this.db) {
      throw new Error(`mongoose connection has not init.`)
    }
    await this.db.close()
  }

  public removeAttribute (object: mongoose.Document): any {
    const result = object.toObject()

    delete result._id
    delete result.uniqueKey
    delete result.createdAt
    delete result.updatedAt

    return result
  }

  /**
   * -------------------------------
   * Contact Section
   * --------------------------------
   */

  public async getContact (
    contactId: string,
  ): Promise<PadplusContactPayload | undefined> {
    const resultDoc = await this.Contact.findOne({
      uniqueKey: this.userName,
      userName: contactId,
    })
    if (resultDoc) {
      return this.removeAttribute(resultDoc)
    } else {
      return undefined
    }
  }

  public async setContact (
    payload: PadplusContactPayload
  ): Promise<void> {
    payload.uniqueKey = this.userName
    const result = this.Contact.findOne({
      uniqueKey: this.userName,
      userName: payload.userName,
    })
    const _contact = new this.Contact(payload)
    if (result) {
      await this.Contact.updateOne({
        uniqueKey: this.userName,
        userName: payload.userName,
      },
      payload,
      {
        upsert: true,
      })
    } else {
      await _contact.save()
    }
  }

  public async deleteContact (
    contactId: string,
  ): Promise<void> {
    await this.Contact.deleteOne({
      uniqueKey: this.userName,
      userName: contactId,
    })
  }

  public async getContactIds (): Promise<string[]> {
    return this.Contact.find({ uniqueKey: this.userName }).distinct('userName')
  }

  public async getAllContacts (): Promise<PadplusContactPayload[]> {
    const result = await this.Contact.find({ uniqueKey: this.userName })
    return result.map(obj => this.removeAttribute(obj))
  }

  public async getContactCount (): Promise<number> {
    return this.Contact.countDocuments({ uniqueKey: this.userName })
  }

  /**
   * -------------------------------
   * Room Section
   * --------------------------------
   */

  public async getRoom (
    roomId: string,
  ): Promise<PadplusRoomPayload | undefined> {
    const resultDoc = await this.Room.findOne({
      chatroomId: roomId,
      uniqueKey: this.userName,
    })
    if (resultDoc) {
      return this.removeAttribute(resultDoc)
    } else {
      return undefined
    }
  }

  public async setRoom (
    payload: PadplusRoomPayload
  ): Promise<void> {
    payload.uniqueKey = this.userName
    const result = this.Room.findOne({
      chatroomId: payload.chatroomId,
      uniqueKey: this.userName,
    })
    const room = new this.Room(payload)
    if (result) {
      await this.Room.updateOne({
        chatroomId: payload.chatroomId,
        uniqueKey: this.userName,
      },
      payload,
      {
        upsert: true,
      })
    } else {
      await room.save()
    }
  }

  public async deleteRoom (
    roomId: string,
  ): Promise<void> {
    await this.Room.deleteOne({
      chatroomId: roomId,
      uniqueKey: this.userName,
    })
  }

  public async getRoomIds (): Promise<string[]> {
    return this.Room.find({ uniqueKey: this.userName }).distinct('chatroomId')
  }

  public async getRoomCount (): Promise<number> {
    return this.Room.countDocuments({ uniqueKey: this.userName })
  }

  /**
   * -------------------------------
   * Room Member Section
   * --------------------------------
   */

  public async getRoomMember (
    roomId: string,
  ): Promise<PadplusRoomMemberMap | undefined> {
    const resultDoc = await this.RoomMember.find({
      chatroomId: roomId,
      uniqueKey: this.userName,
    })
    if (resultDoc && resultDoc.length > 0) {
      let memberMap: PadplusRoomMemberMap = {}
      await Promise.all(resultDoc.map(_member => {
        const member = this.removeAttribute(_member)
        delete member.chatroomId
        memberMap[member.contactId] = member
      }))
      return memberMap
    } else {
      return undefined
    }
  }

  public async setRoomMember (
    roomId: string,
    payload: PadplusRoomMemberMap,
  ): Promise<void> {
    Object.values(payload).map(async member => {
      member.uniqueKey = this.userName
      member.chatroomId = roomId

      const result = this.RoomMember.findOne({
        chatroomId: member.chatroomId,
        contactId: member.contactId,
        uniqueKey: this.userName,
      })

      const roomMember = new this.RoomMember(member)
      if (result) {
        await this.RoomMember.updateOne({
          chatroomId: member.chatroomId,
          contactId: member.contactId,
          uniqueKey: this.userName,
        },
        member,
        {
          upsert: true,
        })
      } else {
        await roomMember.save()
      }
    })

  }

  public async deleteRoomMember (
    roomId: string,
  ): Promise<void> {
    await this.RoomMember.deleteMany({
      chatroomId: roomId,
      uniqueKey: this.userName,
    })
  }

  /**
   * -------------------------------
   * Friendship Section
   * --------------------------------
   */
  public async getFriendshipRawPayload (id: string) {
    const resultDoc = await this.Friendship.findOne({
      contactId: id,
      uniqueKey: this.userName,
    })
    if (resultDoc) {
      return this.removeAttribute(resultDoc)
    } else {
      return undefined
    }
  }

  public async setFriendshipRawPayload (
    payload: FriendshipPayload,
  ) {
    payload.uniqueKey = this.userName
    const result = this.Friendship.findOne({
      contactId: payload.contactId,
      uniqueKey: this.userName,
    })
    const friendship = new this.Friendship(payload)
    if (result) {
      await this.Friendship.updateOne({
        contactId: payload.contactId,
        uniqueKey: this.userName,
      },
      payload,
      {
        upsert: true,
      })
    } else {
      await friendship.save()
    }
  }

  /**
   * -------------------------------
   * Room Invitation Section
   * -------------------------------
   */
  public async getRoomInvitation (
    messageId: string,
  ): Promise<PadplusRoomInvitationPayload | undefined> {
    const resultDoc = await this.RoomInvitation.findOne({
      id: messageId,
      uniqueKey: this.userName,
    })
    if (resultDoc) {
      return this.removeAttribute(resultDoc)
    } else {
      return undefined
    }
  }

  public async setRoomInvitation (
    messageId: string,
    payload: PadplusRoomInvitationPayload,
  ): Promise<void> {
    payload.uniqueKey = this.userName
    const result = this.RoomInvitation.findOne({
      id: messageId,
      uniqueKey: this.userName,
    })
    const roomInvitation = new this.RoomInvitation(payload)
    if (result) {
      await this.RoomInvitation.updateOne({
        id: messageId,
        uniqueKey: this.userName,
      },
      payload,
      {
        upsert: true,
      })
    } else {
      await roomInvitation.save()
    }
  }

  public async deleteRoomInvitation (
    messageId: string,
  ): Promise<void> {
    await this.RoomInvitation.deleteOne({
      id: messageId,
      uniqueKey: this.userName,
    })
  }

}
