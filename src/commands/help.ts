import { Commands, WhatsappCommand, WhatsappCommandOptionType, WhatsappInteraction } from "../utils/whatsappCommand";
import { prefix } from "..";
import { logger } from "../utils/debugging";

export const HelpCommand: WhatsappCommand = {
  name: "help",
  description: "displays help page",
  options: [
    {
      name: "command",
      description: "show help for command?",
      type: WhatsappCommandOptionType.String
    }
  ],
  run: async (interaction: WhatsappInteraction) => {
    const message = [];
    logger((await interaction.message.getContact()).id.server);

    if (interaction.getOption<string>("command")) {
      const command = Commands.find(c => c.name === interaction.getOption<string>("command"));
      if (command) {
        message.push(
          "✳ *command `" + prefix + command.name + "`*",
          "ℹ️ " + command.description,
        );
        if (command.options && command.options.length > 0) {
          message.push(command.options.map(op => `* \`${op.name} (${op.type})\`: _${op.description}_`).join("\n"));
        }
      } else {
        throw new Error ('No command found by the name "' + interaction.getOption<string>("command") + '"');
      }
    } else {
      message.push(
        "*Showing " + Commands.length + " available cmd(s):*",
        Commands.map(c => `* ${prefix}${c.name} ${c.options?.map(op => `\`[${op.name}:${op.type}]\``).join(" | ") || ""}`).join("\n"),
        " ",
        `*Type \`${prefix}help [Command Name]\` for more info.*`
      );
    }
    await interaction.message.reply(message.join("\n"));
  }
};