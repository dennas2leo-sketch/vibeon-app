import nodemailer from "nodemailer";

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailAppPassword,
  },
});

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification email with 6-digit code
 */
export async function sendVerificationEmail(
  email: string,
  verificationCode: string
): Promise<void> {
  if (!gmailUser || !gmailAppPassword) {
    throw new Error("Gmail credentials not configured");
  }

  const mailOptions = {
    from: gmailUser,
    to: email,
    subject: "VibeOn - Código de Verificação",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%); padding: 40px; text-align: center; border-radius: 10px;">
          <h1 style="color: #FFB703; margin: 0; font-size: 28px;">VibeOn</h1>
          <p style="color: #FFFFFF; margin-top: 20px; font-size: 16px;">Bem-vindo ao VibeOn!</p>
        </div>
        
        <div style="padding: 40px; background: #F5F5F5; text-align: center;">
          <p style="color: #0A0A0A; font-size: 14px; margin: 0 0 20px 0;">
            Use o código abaixo para verificar sua conta:
          </p>
          
          <div style="background: #FFFFFF; padding: 20px; border-radius: 10px; margin: 20px 0; border: 2px solid #FF006E;">
            <p style="color: #FF006E; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 0;">
              ${verificationCode}
            </p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin: 20px 0 0 0;">
            Este código expira em 10 minutos.
          </p>
          
          <p style="color: #666; font-size: 12px; margin: 10px 0 0 0;">
            Se você não solicitou este código, ignore este e-mail.
          </p>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #0A0A0A; border-radius: 10px; margin-top: 20px;">
          <p style="color: #FFB703; font-size: 12px; margin: 0;">
            © 2026 VibeOn. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Verification code sent to ${email}`);
  } catch (error) {
    console.error(`[Email] Failed to send verification email to ${email}:`, error);
    throw error;
  }
}

/**
 * Send welcome email after successful registration
 */
export async function sendWelcomeEmail(
  email: string,
  username: string
): Promise<void> {
  if (!gmailUser || !gmailAppPassword) {
    throw new Error("Gmail credentials not configured");
  }

  const mailOptions = {
    from: gmailUser,
    to: email,
    subject: "Bem-vindo ao VibeOn!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%); padding: 40px; text-align: center; border-radius: 10px;">
          <h1 style="color: #FFB703; margin: 0; font-size: 28px;">VibeOn</h1>
          <p style="color: #FFFFFF; margin-top: 20px; font-size: 16px;">Bem-vindo, @${username}!</p>
        </div>
        
        <div style="padding: 40px; background: #F5F5F5; text-align: center;">
          <p style="color: #0A0A0A; font-size: 14px; margin: 0 0 20px 0;">
            Sua conta foi criada com sucesso!
          </p>
          
          <p style="color: #666; font-size: 14px; margin: 10px 0;">
            Agora você pode começar a compartilhar seus momentos e conectar com amigos.
          </p>
          
          <div style="background: #FF006E; padding: 15px; border-radius: 10px; margin: 20px 0;">
            <p style="color: #FFFFFF; font-size: 14px; margin: 0;">
              Aproveite o VibeOn!
            </p>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; background: #0A0A0A; border-radius: 10px; margin-top: 20px;">
          <p style="color: #FFB703; font-size: 12px; margin: 0;">
            © 2026 VibeOn. Todos os direitos reservados.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`[Email] Failed to send welcome email to ${email}:`, error);
    throw error;
  }
}
