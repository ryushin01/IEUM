import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import nodemailer from 'nodemailer';

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

/** SMTP를 지원하는 어떤 메일 서비스든 씁니다. (SES, Resend, Mailgun, 사내 메일 등) */
export function createSmtpMailer(url: string, from: string): Mailer {
  const transport = nodemailer.createTransport(url);
  return {
    send: async (mail) => {
      await transport.sendMail({ from, ...mail });
    },
  };
}

/** 개발·E2E 전용입니다. 메일을 보내지 않고 파일로 남깁니다. */
export function createOutboxMailer(dir: string): Mailer {
  return {
    send: async (mail) => {
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, `${randomUUID()}.json`), JSON.stringify(mail));
    },
  };
}
