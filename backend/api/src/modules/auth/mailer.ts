type SendAuthEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type MailResult = {
  delivered: boolean;
  previewUrl?: string;
};

export async function sendAuthEmail(input: SendAuthEmailInput): Promise<MailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_FROM_EMAIL;

  if (resendApiKey && from) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`EMAIL_SEND_FAILED:${response.status}:${body}`);
    }

    return { delivered: true };
  }

  const previewUrlMatch = input.text.match(/https?:\/\/\S+/);
  const previewUrl = previewUrlMatch?.[0];
  console.log("Auth email preview", {
    to: input.to,
    subject: input.subject,
    previewUrl,
    text: input.text
  });

  return {
    delivered: false,
    previewUrl
  };
}
