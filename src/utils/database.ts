import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, Transaction, CreationOptional, Association, HasManyGetAssociationsMixin, HasManyAddAssociationMixin } from "sequelize";
import { logger } from "../utils/debugging";
import { Chat } from "whatsapp-web.js";

export class Reminder extends Model<InferAttributes<Reminder>, InferCreationAttributes<Reminder>> {
  declare id: number;
  declare text: string;
  declare eventDate: Date;
  declare createdAt?: CreationOptional<Date>;
  declare updatedAt?: CreationOptional<Date>;
}

type ReminderData = {
  text: string;
  eventDate: Date;
};

export class GroupSettings extends Model<InferAttributes<GroupSettings>, InferCreationAttributes<GroupSettings>> {
  declare groupId: string;
  declare pinMessageId?: string;
  declare groupName?: string;
  declare createdAt?: CreationOptional<Date>;
  declare updatedAt?: CreationOptional<Date>;

  public getReminders!: HasManyGetAssociationsMixin<Reminder>;
  public addReminder!: HasManyAddAssociationMixin<Reminder, number>;

  public static associations: {
    reminders: Association<GroupSettings, Reminder>;
  };
}

let sequelize: Sequelize;
let isDebugging = false;

export default async (storage: string) => {
  isDebugging = process.env.DEBUG_MODE?.toLowerCase() === "true";
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storage,
    logging: msg => isDebugging && logger(`[DB] ${msg}`)
  });

  Reminder.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    text: { type: DataTypes.STRING },
    eventDate: { type: DataTypes.DATE },
    createdAt: { type: DataTypes.DATE, allowNull: true },
    updatedAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    tableName: "reminders",
    timestamps: true
  });

  GroupSettings.init({
    groupId: { type: DataTypes.STRING, primaryKey: true },
    groupName: { type: DataTypes.STRING, allowNull: true },
    pinMessageId: { type: DataTypes.STRING, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: true },
    updatedAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    tableName: "groupSettings",
    timestamps: true
  });

  GroupSettings.hasMany(Reminder);
  Reminder.belongsTo(GroupSettings);

  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });
    logger("[DB] Database manager loaded!");
  } catch (error) {
    logger(`[DB] Unable to connect to the database: ${error}`);
  }
};

export const loggedTransaction = async (callback: (transaction: Transaction) => Promise<any>): Promise<any> => {
  const transaction = await sequelize.transaction();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    if (isDebugging) logger("[DB] Transaction committed successfully.");
    return result;
  } catch (error) {
    await transaction.rollback();
    logger(`[DB] Transaction failed, rolled back: ${error}`);
    throw error;
  }
};

export const getGroupSettings = async (chat: Chat): Promise<GroupSettings> => {
  if (!chat.isGroup) throw new Error ('Not a group chat');
  return await loggedTransaction(async (transaction) => {
    let groupSettings = await GroupSettings.findOne({ transaction: transaction, where: { groupId: chat.id._serialized}});
    if (!groupSettings) {
      groupSettings = GroupSettings.build({
        groupId: chat.id._serialized
      });

      await groupSettings.save({ transaction: transaction });
    }

    return groupSettings;
  });
};

export const setGroupSettings = async (groupSettings: GroupSettings): Promise<GroupSettings> => {
  return await loggedTransaction(async (transaction) => {
    await groupSettings.save({ transaction: transaction });
    return groupSettings;
  });
};

export const getGroupReminders = async (group: GroupSettings): Promise<Array<Reminder>> => {
  return await loggedTransaction(async (transaction) => {
    return group.getReminders({ transaction: transaction });
  });
};

export const addRemindersToGroup = async (group: GroupSettings, remindersData: ReminderData[]) => {
  return await loggedTransaction(async (transaction) => {
    const reminders = await Promise.all(
      remindersData.map(async (reminderData: ReminderData) => {
        const reminder = await Reminder.create({
          ...reminderData
        } as any, { transaction });
        await group.addReminder(reminder, { transaction });
        return reminder;
      })
    );

    return reminders;
  });
};

export const deleteReminder = async (_group: GroupSettings, id: number) => {
  return await loggedTransaction(async (transaction) => {
    await Reminder.destroy({
      where: { id: id },
      force: true,
      transaction: transaction
    });
  });
};