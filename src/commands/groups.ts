import { getGroupSettings, setGroupSettings } from "../utils/database";
import { inGroup } from "../utils/helpers";
import { WhatsappCommand, WhatsappCommandOptionType, WhatsappInteraction } from "../utils/whatsappCommand";

export const SetGroupNameCommand: WhatsappCommand = {
  name: "setgroupname",
  description: "Set the group's name to the specified name.",
  options: [
    {
      name: 'name',
      type: WhatsappCommandOptionType.String,
      required: true,
      description: 'The name the group will have'
    }
  ],
  run: async (interaction: WhatsappInteraction) => {
    const newName = interaction.getOption<string>('name');
    if (!newName) throw new Error("newName not set.");

    try {
      if (interaction.message.fromMe || interaction.getOption<boolean>("incognito")) interaction.message.delete(true);
    } catch (_err: any) { };
    if (!inGroup(await interaction.message.getChat())) throw new Error ("Must be in a group to use this command.");    

    const chat = await interaction.message.getChat();
    try {
      const groupSettings = await getGroupSettings(chat);

      groupSettings.groupName = newName;

      await setGroupSettings(groupSettings);
    } catch (err: any) {
      throw new Error ('Unable to set group name! ' + err);
    }
    await interaction.message.reply('Successfully set group name to `' + newName + '`');
  }

};