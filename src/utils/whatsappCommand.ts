import { Message } from "whatsapp-web.js";
import { HelpCommand } from "../commands/help";
import { DeleteReminderCommand, ListReminderCommand, SetReminderCommand, UpdateReminderCommand } from "../commands/reminders";
import { SetGroupNameCommand } from "../commands/groups";

export interface WhatsappCommand {
  name: string,
  description: string,
  options?: WhatsappCommandOption[]
  run: (interaction: WhatsappInteraction) => void
}

export interface WhatsappCommandOption {
  name: string,
  description: string,
  type: WhatsappCommandOptionType,
  required?: boolean
}

export const enum WhatsappCommandOptionType {
  Boolean = "boolean",
  String = "string",
  Number = "number",
  Date = "date"
}

export type WhatsappCommandOptionValue =
| string
| number
| boolean
| Date
| null;

export type WhatsappCommandArgs = { [key: string]: WhatsappCommandOptionValue };

export class WhatsappInteraction {
  message: Message;
  options: WhatsappCommandArgs;
  
  constructor(msg: Message, args: WhatsappCommandArgs) {
    // Automatically assign all properties from the Message object
    this.message = msg;
    this.options = args;
  }

  getOption<T extends WhatsappCommandOptionValue>(name: string): T | null {
    const value = this.options[name];  // Handle string-indexing safely
    if (value === undefined || value === null) return null;
    return value as T;
  }
}

export const Commands: WhatsappCommand[] = [
  HelpCommand,
  SetGroupNameCommand,
  SetReminderCommand,
  ListReminderCommand,
  DeleteReminderCommand,
  UpdateReminderCommand
];