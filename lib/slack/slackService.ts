/**
 * Slack Service
 * 
 * Zentraler Service für alle Slack Notifications.
 * Unterstützt verschiedene Channels für verschiedene Event-Typen.
 */

export type SlackChannel = 'unknown' | 'errors' | 'waitlist' | 'analytics';

// Webhook URLs aus Environment
const WEBHOOKS: Record<SlackChannel, string | undefined> = {
  unknown: process.env.SLACK_WEBHOOK_UNKNOWN || process.env.SLACK_WEBHOOK_URL,
  errors: process.env.SLACK_WEBHOOK_ERRORS || process.env.SLACK_WEBHOOK_URL,
  waitlist: process.env.SLACK_WEBHOOK_WAITLIST || process.env.SLACK_WEBHOOK_URL,
  analytics: process.env.SLACK_WEBHOOK_ANALYTICS || process.env.SLACK_WEBHOOK_URL,
};

// Slack Block Types
export interface SlackTextBlock {
  type: 'section';
  text: {
    type: 'mrkdwn' | 'plain_text';
    text: string;
  };
}

export interface SlackDividerBlock {
  type: 'divider';
}

export interface SlackContextBlock {
  type: 'context';
  elements: {
    type: 'mrkdwn' | 'plain_text';
    text: string;
  }[];
}

export interface SlackHeaderBlock {
  type: 'header';
  text: {
    type: 'plain_text';
    text: string;
    emoji?: boolean;
  };
}

export type SlackBlock = SlackTextBlock | SlackDividerBlock | SlackContextBlock | SlackHeaderBlock;

export interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
  attachments?: {
    color?: string;
    text?: string;
  }[];
}

/**
 * Sendet eine Nachricht an einen Slack Channel
 */
export async function sendSlackMessage(
  channel: SlackChannel,
  message: string,
  blocks?: SlackBlock[]
): Promise<boolean> {
  const webhookUrl = WEBHOOKS[channel];
  
  if (!webhookUrl) {
    console.log(`Slack notification skipped: No webhook URL for channel "${channel}"`);
    return false;
  }

  try {
    const payload: SlackMessage = {
      text: message,
    };

    if (blocks && blocks.length > 0) {
      payload.blocks = blocks;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Slack API error: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Slack notification failed:', error);
    return false;
  }
}

/**
 * Sendet eine formatierte Nachricht für unbekannte Inhaltsstoffe
 */
export async function notifyUnknownIngredient(
  name: string,
  form?: string,
  context?: string,
  occurrences?: number
): Promise<boolean> {
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:pill: *Neuer unbekannter Inhaltsstoff*\n> ${name}${form ? ` (${form})` : ''}`,
      },
    },
  ];

  if (context || occurrences) {
    const contextElements: { type: 'mrkdwn'; text: string }[] = [];
    if (context) {
      contextElements.push({ type: 'mrkdwn', text: `_${context}_` });
    }
    if (occurrences && occurrences > 1) {
      contextElements.push({ type: 'mrkdwn', text: `_${occurrences}x gescannt_` });
    }
    blocks.push({
      type: 'context',
      elements: contextElements,
    });
  }

  return sendSlackMessage('unknown', `Neuer unbekannter Inhaltsstoff: ${name}`, blocks);
}

/**
 * Sendet eine formatierte Nachricht für unbekannte Zertifizierungen
 */
export async function notifyUnknownCertification(
  name: string,
  occurrences?: number
): Promise<boolean> {
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:medal: *Neue unbekannte Zertifizierung*\n> ${name}`,
      },
    },
  ];

  if (occurrences && occurrences > 1) {
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `_${occurrences}x gescannt_` }],
    });
  }

  return sendSlackMessage('unknown', `Neue unbekannte Zertifizierung: ${name}`, blocks);
}

/**
 * Sendet eine formatierte Nachricht für Waitlist Anmeldungen
 */
export async function notifyWaitlistSignup(
  email: string,
  totalCount?: number
): Promise<boolean> {
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:tada: *Neue Waitlist Anmeldung*\n> ${email}`,
      },
    },
  ];

  if (totalCount) {
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `_Total: ${totalCount} Anmeldungen_` }],
    });
  }

  return sendSlackMessage('waitlist', `Neue Waitlist Anmeldung: ${email}`, blocks);
}

/**
 * Sendet eine Fehlermeldung an den Error-Channel
 */
export async function notifyError(
  error: string,
  context?: string,
  stack?: string
): Promise<boolean> {
  const blocks: SlackBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:x: *API Error*\n> ${error}`,
      },
    },
  ];

  if (context) {
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `_Context: ${context}_` }],
    });
  }

  if (stack) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `\`\`\`${stack.substring(0, 500)}\`\`\``,
      },
    });
  }

  return sendSlackMessage('errors', `API Error: ${error}`, blocks);
}

/**
 * Sendet Analytics/Stats Nachricht
 */
export async function notifyAnalytics(
  title: string,
  stats: Record<string, number | string>
): Promise<boolean> {
  const statsText = Object.entries(stats)
    .map(([key, value]) => `• *${key}:* ${value}`)
    .join('\n');

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: title,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: statsText,
      },
    },
  ];

  return sendSlackMessage('analytics', title, blocks);
}
