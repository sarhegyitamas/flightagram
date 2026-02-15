/**
 * Telegram Bot Command Handlers
 * Handles incoming bot commands like /start, /stop, /status
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { telegramLogger as logger } from '@/lib/logging';
import { telegramAdapter } from './adapter';
import type { ParsedWebhookCommand } from '@/types';

/**
 * Handle the /start command (opt-in)
 */
async function handleStartCommand(command: ParsedWebhookCommand): Promise<string> {
  const { chatId, userId, username, token } = command;

  if (!token) {
    // No token = user clicked on bot directly without deep link
    return `Welcome to Flightagram!

I send flight status updates to keep your loved ones informed about your travels.

To get started, a traveller needs to add you as a contact. Once they do, you'll receive a special link to activate updates.

If you already have a link, click it to start receiving updates!`;
  }

  // Look up the opt-in token
  const supabase = createAdminClient();

  const { data: link, error: linkError } = await supabase
    .from('traveller_receiver_links')
    .select(`
      id,
      opt_in_status,
      receiver_id,
      traveller_id,
      receivers!inner(id, display_name),
      travellers!inner(id, display_name)
    `)
    .eq('opt_in_token', token)
    .single();

  if (linkError || !link) {
    logger.warn('Invalid opt-in token', { token, chatId });
    return `Sorry, this invitation link is not valid or has expired. Please ask the traveller to send you a new invitation.`;
  }

  if (link.opt_in_status === 'ACTIVE') {
    return `You're already set up to receive flight updates! No further action needed.`;
  }

  if (link.opt_in_status === 'UNSUBSCRIBED') {
    // Re-subscribe
    await supabase
      .from('traveller_receiver_links')
      .update({
        opt_in_status: 'ACTIVE',
        opted_in_at: new Date().toISOString(),
      })
      .eq('id', link.id);

    // Update receiver with Telegram info
    await supabase
      .from('receivers')
      .update({
        telegram_chat_id: chatId,
        telegram_opted_in: true,
        telegram_username: username || null,
      })
      .eq('id', link.receiver_id);

    const traveller = link.travellers as unknown as { display_name: string };
    return `Welcome back! You've been re-subscribed to receive flight updates for ${traveller.display_name}'s travels.

Send /stop at any time to unsubscribe.`;
  }

  // First time opt-in
  const { error: updateError } = await supabase
    .from('traveller_receiver_links')
    .update({
      opt_in_status: 'ACTIVE',
      opted_in_at: new Date().toISOString(),
    })
    .eq('id', link.id);

  if (updateError) {
    logger.error('Failed to update opt-in status', { linkId: link.id }, updateError);
    return `Sorry, something went wrong. Please try again later.`;
  }

  // Update receiver with Telegram info
  const { error: receiverError } = await supabase
    .from('receivers')
    .update({
      telegram_chat_id: chatId,
      telegram_opted_in: true,
      telegram_username: username || null,
    })
    .eq('id', link.receiver_id);

  if (receiverError) {
    logger.error('Failed to update receiver', { receiverId: link.receiver_id }, receiverError);
  }

  logger.info('Receiver opted in successfully', {
    linkId: link.id,
    receiverId: link.receiver_id,
    chatId,
    username,
  });

  const traveller = link.travellers as unknown as { display_name: string };
  return `You're all set! You'll now receive flight status updates for ${traveller.display_name}'s travels.

I'll send you updates when:
• Their flight departs
• They're in the air
• They land safely
• There are any delays or changes

Send /stop at any time to unsubscribe.`;
}

/**
 * Handle the /stop command (unsubscribe)
 */
async function handleStopCommand(command: ParsedWebhookCommand): Promise<string> {
  const { chatId } = command;

  const supabase = createAdminClient();

  // Find all active links for this chat
  const { data: receiver } = await supabase
    .from('receivers')
    .select('id')
    .eq('telegram_chat_id', chatId)
    .single();

  if (!receiver) {
    return `You don't appear to have any active subscriptions.`;
  }

  // Unsubscribe from all travellers
  const { data: links, error } = await supabase
    .from('traveller_receiver_links')
    .update({ opt_in_status: 'UNSUBSCRIBED' })
    .eq('receiver_id', receiver.id)
    .eq('opt_in_status', 'ACTIVE')
    .select();

  if (error) {
    logger.error('Failed to unsubscribe', { receiverId: receiver.id }, error);
    return `Sorry, something went wrong. Please try again later.`;
  }

  // Mark receiver as no longer opted in
  await supabase
    .from('receivers')
    .update({ telegram_opted_in: false })
    .eq('id', receiver.id);

  const count = links?.length || 0;

  if (count === 0) {
    return `You don't have any active subscriptions to unsubscribe from.`;
  }

  logger.info('Receiver unsubscribed', { receiverId: receiver.id, count });

  return `You've been unsubscribed from ${count} traveller${count > 1 ? 's' : ''}. You won't receive any more flight updates.

To re-subscribe, you'll need a new invitation link from the traveller.`;
}

/**
 * Handle the /status command
 */
async function handleStatusCommand(command: ParsedWebhookCommand): Promise<string> {
  const { chatId } = command;

  const supabase = createAdminClient();

  // Find receiver by chat ID
  const { data: receiver } = await supabase
    .from('receivers')
    .select('id, display_name')
    .eq('telegram_chat_id', chatId)
    .single();

  if (!receiver) {
    return `You haven't connected to Flightagram yet. Use an invitation link from a traveller to get started.`;
  }

  // Get active subscriptions
  const { data: links } = await supabase
    .from('traveller_receiver_links')
    .select(`
      id,
      opt_in_status,
      travellers!inner(display_name)
    `)
    .eq('receiver_id', receiver.id);

  if (!links || links.length === 0) {
    return `You're registered but not subscribed to any travellers yet.`;
  }

  const activeLinks = links.filter((l) => l.opt_in_status === 'ACTIVE');

  if (activeLinks.length === 0) {
    return `You're registered but have unsubscribed from all travellers. Use a new invitation link to re-subscribe.`;
  }

  const travellerNames = activeLinks
    .map((l) => {
      const traveller = l.travellers as unknown as { display_name: string };
      return `• ${traveller.display_name}`;
    })
    .join('\n');

  return `You're receiving flight updates for:
${travellerNames}

Send /stop to unsubscribe from all updates.`;
}

/**
 * Handle an unknown command
 */
async function handleUnknownCommand(command: ParsedWebhookCommand): Promise<string> {
  return `I didn't understand that command.

Available commands:
/status - Check your subscription status
/stop - Unsubscribe from all flight updates

To subscribe, you need an invitation link from a traveller.`;
}

/**
 * Main command handler
 */
export async function handleTelegramCommand(
  command: ParsedWebhookCommand
): Promise<void> {
  logger.info('Handling Telegram command', {
    type: command.type,
    chatId: command.chatId,
    username: command.username,
  });

  let response: string;

  switch (command.type) {
    case 'START':
      response = await handleStartCommand(command);
      break;
    case 'STOP':
      response = await handleStopCommand(command);
      break;
    case 'STATUS':
      response = await handleStatusCommand(command);
      break;
    default:
      response = await handleUnknownCommand(command);
  }

  // Send response back to user
  await telegramAdapter.sendMessage(command.chatId, response);
}
