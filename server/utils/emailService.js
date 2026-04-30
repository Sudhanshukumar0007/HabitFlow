const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendPasswordResetEmail = async (email, resetToken, username) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await transporter.sendMail({
    from: `"HabitFlow" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '🔑 Reset Your HabitFlow Password',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #fff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🌊 HabitFlow</h1>
          <p style="margin: 8px 0 0; opacity: 0.8;">Password Reset Request</p>
        </div>
        <div style="padding: 40px;">
          <p>Hi <strong>${username}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #888; font-size: 13px;">If you didn't request this, ignore this email. Your password won't change.</p>
        </div>
      </div>
    `,
  });
};

const sendDailyDigest = async (email, username, habits, streakInfo) => {
  const transporter = createTransporter();
  const incompletHabits = habits.filter((h) => !h.completedToday);

  const habitList = incompletHabits
    .map(
      (h) =>
        `<li style="padding: 8px 0; border-bottom: 1px solid #1e1e2e;">
        <span style="color: ${h.color};">●</span> <strong>${h.name}</strong>
        ${h.currentStreak > 0 ? `<span style="color: #f59e0b;">🔥 ${h.currentStreak} day streak</span>` : ''}
      </li>`
    )
    .join('');

  await transporter.sendMail({
    from: `"HabitFlow" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `📋 Your Daily Habit Summary - ${new Date().toLocaleDateString()}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #fff; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🌊 HabitFlow Daily Digest</h1>
        </div>
        <div style="padding: 32px;">
          <p>Good morning, <strong>${username}</strong>! 🌟</p>
          ${incompletHabits.length > 0
            ? `<p>You have <strong>${incompletHabits.length}</strong> habits to complete today:</p>
               <ul style="list-style: none; padding: 0;">${habitList}</ul>`
            : `<p style="color: #22c55e; font-size: 18px;">🎉 All habits completed today! Amazing work!</p>`
          }
          <div style="background: #1e1e2e; border-radius: 12px; padding: 20px; margin-top: 24px;">
            <p style="margin: 0; color: #888;">Best streak: <strong style="color: #f59e0b;">🔥 ${streakInfo.best} days</strong></p>
          </div>
          <p style="color: #6366f1; font-weight: 600; margin-top: 24px;">Keep building those habits! 💪</p>
        </div>
      </div>
    `,
  });
};

module.exports = { sendPasswordResetEmail, sendDailyDigest };
