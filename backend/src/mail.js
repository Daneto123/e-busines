'use strict';

// E-mail through any SMTP server, configured in .env (never in the code).
// Without SMTP settings nothing is sent and the requests are only kept in the
// database, where sellers see them in their panel.

const nodemailer = require('nodemailer');

function createMailer(env = process.env) {
  if (!env.SMTP_HOST) return null;
  const port = Number(env.SMTP_PORT) || 465;
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  const from = env.MAIL_FROM || env.SMTP_USER;
  return { sendMail: (message) => transport.sendMail({ from, ...message }) };
}

function caseRequestEmail(request, sellers) {
  const size = [request.heightMm, request.widthMm, request.thicknessMm].every((v) => v)
    ? `${request.heightMm} × ${request.widthMm} × ${request.thicknessMm} мм`
    : 'не са посочени';
  return {
    bcc: sellers.map((s) => s.email), // sellers do not see each other's addresses
    replyTo: request.email,
    subject: `Заявка за калъф: ${request.phoneModel}`,
    text: [
      'Нова заявка за калъф, който го няма в магазина.',
      '',
      `Телефон: ${request.phoneModel}`,
      `Размери (В × Ш × Д): ${size}`,
      `Цвят: ${request.color || 'без значение'}`,
      `Подробности: ${request.details || '—'}`,
      '',
      `Отговорете директно на този имейл, за да пишете на клиента (${request.email}).`,
    ].join('\n'),
  };
}

module.exports = { createMailer, caseRequestEmail };
