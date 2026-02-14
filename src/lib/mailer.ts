import nodemailer from "nodemailer";
import { Resend } from "resend";

type MailProfile = "default" | "reminder";

type MailerConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

const PROFILE_ENV_KEYS: Record<
  MailProfile,
  {
    host: string;
    port: string;
    secure: string;
    user: string;
    pass: string;
    from: string;
  }
> = {
  default: {
    host: "SMTP_HOST",
    port: "SMTP_PORT",
    secure: "SMTP_SECURE",
    user: "SMTP_USER",
    pass: "SMTP_PASS",
    from: "SMTP_FROM",
  },
  reminder: {
    host: "REMINDER_SMTP_HOST",
    port: "REMINDER_SMTP_PORT",
    secure: "REMINDER_SMTP_SECURE",
    user: "REMINDER_SMTP_USER",
    pass: "REMINDER_SMTP_PASS",
    from: "REMINDER_SMTP_FROM",
  },
};

const transportCache: Partial<Record<MailProfile, nodemailer.Transporter>> = {};
const configCache: Partial<Record<MailProfile, MailerConfig>> = {};
let resendClient: Resend | null = null;

function getEnv(key: string) {
  return process.env[key];
}

/** Resend has better deliverability (SPF/DKIM/DMARC handled) — use when configured. */
export function isResendConfigured(): boolean {
  return Boolean(getEnv("RESEND_API_KEY")?.trim() && getEnv("RESEND_FROM")?.trim());
}

function getResendFrom(profile: MailProfile): string {
  const from = getEnv("RESEND_FROM")?.trim();
  if (from) return from;
  const profileFrom = getEnv(PROFILE_ENV_KEYS[profile].from)?.trim();
  if (profileFrom) return profileFrom;
  throw new Error("Set RESEND_FROM or REMINDER_SMTP_FROM (must be from a domain verified in Resend)");
}

function isProfileConfigured(profile: MailProfile) {
  const keys = PROFILE_ENV_KEYS[profile];
  return Boolean(getEnv(keys.host) && getEnv(keys.user) && getEnv(keys.pass) && getEnv(keys.from));
}

function loadConfig(profile: MailProfile): MailerConfig {
  if (!isProfileConfigured(profile)) {
    const keys = PROFILE_ENV_KEYS[profile];
    throw new Error(
      `SMTP profile "${profile}" is not configured. Please set ${keys.host}, ${keys.user}, ${keys.pass}, ${keys.from} (and optional ${keys.port}, ${keys.secure}).`
    );
  }
  const keys = PROFILE_ENV_KEYS[profile];
  const rawPort = Number(getEnv(keys.port) ?? "587");
  const port = Number.isNaN(rawPort) ? 587 : rawPort;
  const secureEnv = getEnv(keys.secure)?.toLowerCase();
  const secure = secureEnv === "true" ? true : secureEnv === "false" ? false : port === 465;

  return {
    host: getEnv(keys.host)!,
    port,
    secure,
    user: getEnv(keys.user)!,
    pass: getEnv(keys.pass)!,
    from: getEnv(keys.from)!,
  };
}

function getTransporter(profile: MailProfile) {
  if (!transportCache[profile] || !configCache[profile]) {
    const config = loadConfig(profile);
    configCache[profile] = config;
    transportCache[profile] = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }
  return { transporter: transportCache[profile]!, config: configCache[profile]! };
}

export function isSmtpConfigured(profile: MailProfile = "default") {
  return isResendConfigured() || isProfileConfigured(profile);
}

type SendMailArgs = {
  to: string;
  subject: string;
  html: string;
  profile?: MailProfile;
  replyTo?: string;
};

export async function sendMail({ to, subject, html, profile = "default", replyTo }: SendMailArgs) {
  if (!to) {
    throw new Error("Missing 'to' when sending email");
  }

  // Prefer Resend for better deliverability (fixes iCloud/Gmail blocks)
  if (isResendConfigured()) {
    if (!resendClient) {
      resendClient = new Resend(getEnv("RESEND_API_KEY")!);
    }
    const from = getResendFrom(profile);
    const { error } = await resendClient.emails.send({
      from,
      to,
      replyTo: replyTo || undefined,
      subject,
      html,
    });
    if (error) throw new Error(`Resend: ${error.message}`);
    return;
  }

  const { transporter: smtp, config } = getTransporter(profile);
  await smtp.sendMail({
    from: config.from,
    to,
    replyTo: replyTo || undefined,
    subject,
    html,
  });
}
