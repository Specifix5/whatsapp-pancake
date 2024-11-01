import { WhatsappCommand, WhatsappCommandOptionType, WhatsappInteraction } from "../utils/whatsappCommand";
import { addRemindersToGroup, deleteReminder, getGroupReminders, getGroupSettings, GroupSettings, loggedTransaction, Reminder, setGroupSettings } from "../utils/database";
import { formatDateTime, getDateInTimezone, getDayNameInTimezone, getDayOrder } from "../utils/dates";
import { Chat } from "whatsapp-web.js";

const queueForDeletion = async (queue: Array<Reminder>) => {
 await loggedTransaction(async (transaction) => {
  await Promise.all(queue.map(async r => {
    await Reminder.destroy({
      where: { id: r.id },
      force: true,
      transaction: transaction
    });
  }));
 }) 
}

const filterOutdatedReminders = async (groupSettings: GroupSettings): Promise<Array<Reminder>> => {
  let filteredReminders = await getGroupReminders(groupSettings);

  let queuedForDeletion: Reminder[] = [];
  filteredReminders = filteredReminders.map(r => {
    if (r.eventDate.getTime() < new Date().getTime()) {
      queuedForDeletion.push(r);
      return;
    } else {
      return r;
    }
  }) as Reminder[];

  await queueForDeletion(queuedForDeletion);
  return filteredReminders;
}

const createReminderMessage = async (chat: Chat, groupSettings: GroupSettings) => {
  let reminders = await filterOutdatedReminders(groupSettings);
  let now = new Date();
  let startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  let currentWeek = reminders.filter(r => {
    const daysDifference = Math.floor((r.eventDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
    return daysDifference >= 0 && daysDifference <= 7;
  }).sort((a, b) => getDayOrder(a.eventDate) - getDayOrder(b.eventDate));

  let nextWeek = reminders.filter(r => {
    const daysDifference = Math.floor((r.eventDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
    return daysDifference > 7 && daysDifference <= 14;
  }).sort((a, b) => getDayOrder(a.eventDate) - getDayOrder(b.eventDate));

  let twoWeeksOut = reminders.filter(r => {
    const daysDifference = Math.floor((r.eventDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
    return daysDifference > 14 && daysDifference <= 21;
  }).sort((a, b) => getDayOrder(a.eventDate) - getDayOrder(b.eventDate));

  let previousMessage = groupSettings.pinMessageId ? (await chat.fetchMessages({ fromMe: true, limit: 100 })).find(m => m.id.id === groupSettings.pinMessageId) : null;
  if (previousMessage) {
    await previousMessage.unpin();
    await previousMessage.delete(true);
  }

  let messageBody = [
    `❇️ *${groupSettings.groupName || "Unnamed"} Calendar*`,
    " ",
    currentWeek.length > 0 ? "*THIS WEEK REMINDERS*\n" + currentWeek.map(r => `* *[${getDayNameInTimezone(r.eventDate, process.env.TIMEZONE)}, ${getDateInTimezone(r.eventDate, process.env.TIMEZONE)}]* ${r.text}`).join("\n") + "\n" : "",
    nextWeek.length > 0 ? "*NEXT WEEK REMINDERS*\n" + nextWeek.map(r => `* *[${getDayNameInTimezone(r.eventDate, process.env.TIMEZONE)}, ${getDateInTimezone(r.eventDate, process.env.TIMEZONE)}]* ${r.text}`).join("\n") + "\n" : "",
    twoWeeksOut.length > 0 ? "*IN 2 WEEKS*\n" + twoWeeksOut.map(r => `* *[${getDayNameInTimezone(r.eventDate, process.env.TIMEZONE)}, ${getDateInTimezone(r.eventDate, process.env.TIMEZONE)}]* ${r.text}`).join("\n") + "\n" : "",
    "ℹ️ _Format: [Day dd/mm] Notice_",
    "🕓 _Last updated: " + formatDateTime(new Date(), process.env.TIMEZONE) + "_"
  ];

  let pinMessage = await chat.sendMessage(messageBody.join("\n"));
  await pinMessage.pin(60 * 60 * 60 * 72);

  groupSettings.pinMessageId = pinMessage.id.id;
  await setGroupSettings(groupSettings);
}

export const SetReminderCommand: WhatsappCommand = {
  name: "addreminder",
  description: "Add a reminder for important things",
  options: [
    {
      name: "text",
      description: "important text to notice of",
      required: true,
      type: WhatsappCommandOptionType.String
    },
    {
      name: "date",
      description: "due date in dd/mm/yy",
      required: true,
      type: WhatsappCommandOptionType.Date
    },
    {
      name: "incognito",
      description: "delete your message after",
      required: false,
      type: WhatsappCommandOptionType.Boolean
    }
  ],
  run: async (interaction: WhatsappInteraction) => {
    let date = interaction.getOption<Date>("date");
    let text = interaction.getOption<string>("text");
    if (!date) throw new Error("Date not set.");

    // So the date actually changes instead of being the day before because 0:00
    date.setHours(24);
    
    try {
      if (interaction.message.fromMe || interaction.getOption<boolean>("incognito")) await interaction.message.delete(true);
    } catch (err: any) { };

    if (!(await interaction.message.getChat()).isGroup) throw new Error ("Must be in a group to use this command.");
    if (date.getTime() < new Date().getTime()) throw new Error ("Event date can't be in the past!");
    if ((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 7) > 2) throw new Error ("Event Date can only be a maximum of 2 weeks out!") 

    let chat = await interaction.message.getChat();
    let groupSettings = await getGroupSettings(chat);

    await addRemindersToGroup(groupSettings, [
      {
        text: text || "None",
        eventDate: date
      }
    ]);

    await createReminderMessage(chat, groupSettings);
  }
}

export const ListReminderCommand: WhatsappCommand = {
  name: "listreminders",
  description: "List reminder id(s)",
  options: [
    {
      name: "incognito",
      description: "delete your message after",
      type: WhatsappCommandOptionType.Boolean
    }
  ],
  run: async (interaction: WhatsappInteraction) => {
    try {
      if (interaction.message.fromMe || interaction.getOption<boolean>("incognito")) await interaction.message.delete(true);
    } catch (err: any) { };

    if (!(await interaction.message.getChat()).isGroup) throw new Error ("Must be in a group to use this command.");

    let chat = await interaction.message.getChat();
    let groupSettings = await getGroupSettings(chat);

    let reminders = await getGroupReminders(groupSettings);
    let messageBody = [
      `📝 *${groupSettings.groupName || "Unnamed"} Reminders List*`,
      "ℹ _Format: [#Id] Notice_",
      " ",
      "```" + reminders.map(r => `[#${r.id}] ${r.text}`).join("\n") + "```"
    ]

    await interaction.message.reply(messageBody.join("\n"));
  }
}

export const DeleteReminderCommand: WhatsappCommand = {
  name: "delreminder",
  description: "Delete a reminder by its specified id",
  options: [
    {
      name: "id",
      description: "the reminder id",
      type: WhatsappCommandOptionType.Number,
      required: true
    },
    {
      name: "incognito",
      description: "delete your message after",
      type: WhatsappCommandOptionType.Boolean
    }
  ],
  run: async (interaction: WhatsappInteraction) => {
    try {
      if (interaction.message.fromMe || interaction.getOption<boolean>("incognito")) await interaction.message.delete(true);
    } catch (err: any) { };

    if (!(await interaction.message.getChat()).isGroup) throw new Error ("Must be in a group to use this command.");

    let chat = await interaction.message.getChat();
    let groupSettings = await getGroupSettings(chat);
    let id = interaction.getOption<number>("id");
    if (!id) throw new Error ("Id not found!");

    await deleteReminder(groupSettings, id);
    await interaction.message.reply("Successfully deleted reminder #" + id);
    await createReminderMessage(chat, groupSettings);
  }
}

export const UpdateReminderCommand: WhatsappCommand = {
  name: "updatereminders",
  description: "Updates the pinned reminders list",
  options: [
    {
      name: "incognito",
      description: "delete your message after",
      type: WhatsappCommandOptionType.Boolean
    }
  ],
  run: async (interaction: WhatsappInteraction) => {
    try {
      if (interaction.message.fromMe || interaction.getOption<boolean>("incognito")) await interaction.message.delete(true);
    } catch (err: any) { };

    if (!(await interaction.message.getChat()).isGroup) throw new Error ("Must be in a group to use this command.");

    let chat = await interaction.message.getChat();
    let groupSettings = await getGroupSettings(chat);

    await createReminderMessage(chat, groupSettings);
  }
}