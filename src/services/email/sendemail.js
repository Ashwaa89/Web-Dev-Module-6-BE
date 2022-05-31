import mailClient from "@sendgrid/mail";
mailClient.setApiKey(process.env.SENDGRID_API_KEY);
export const sendEmail = async (to, subject, textBody, htmlBody) => {
  try {
    await mailClient.send({
      to: to,
      from: process.env.FROM_ADDRESS,
      subject: subject,
      text: textBody,
      html: htmlBody,
    });
  } catch (error) {
    console.log(error);
  }
};
