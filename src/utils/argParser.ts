import { WhatsappCommandArgs, WhatsappCommandOption, WhatsappCommandOptionType } from "./whatsappCommand";

export function parseRawArgs(input: string): Array<string> {
  const regex = /\[\[(.*?)\]\]|(\S+)/g;
  const args = [];
  let match;

  while ((match = regex.exec(input)) !== null) {
    args.push(match[1] || match[2]);
  }

  return args;
}

export const parseMessageArgs = (args: string[], commandOptions?: Array<WhatsappCommandOption>): WhatsappCommandArgs => {
  const options: WhatsappCommandArgs = {};

  if (!commandOptions) commandOptions = [];

  commandOptions.forEach((option, index) => {
    const arg = args[index];

    if (option.required && (arg === undefined || arg === null)) throw new Error('Missing required arguments "' + option.name + '"');

    // Parse and store the argument based on the type defined in the command options
    switch (option.type) {
      case WhatsappCommandOptionType.Boolean:
        options[option.name] = arg ? arg.toLowerCase() === 'true' : false;
        break;
      case WhatsappCommandOptionType.String:
        options[option.name] = arg || null;
        break;
      case WhatsappCommandOptionType.Number:
        if (isNaN(Number(arg))) throw new Error ('Arg "' + option.name + '" is not a number!');
        options[option.name] = Number(arg);
        break;
      case WhatsappCommandOptionType.Date:
        const rawDate = arg.replace(/-+|\/+/g, " ").trim().split(/\s+/);
        if (rawDate.length < 3) throw new Error ('Invalid Date argument provided ' + rawDate.join("-"));
        
        const date = new Date(`${rawDate[1]}-${rawDate[0]}-${rawDate[2]}`);
        if (isNaN(date.getTime())) throw new Error ('Invalid Date argument provided ' + rawDate);

        options[option.name] = date;
        break;
      default:
        options[option.name] = null; // Handle other types as needed
        break;
    }
  });

  return options;
};