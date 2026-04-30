const User = require('../models/User');
const Habit = require('../models/Habit');

// @PUT /api/user/settings
const updateSettings = async (req, res, next) => {
  try {
    const { email, username, password, newPassword, notificationsEnabled, isPublic, dailyDigestTime, reminderEmail, avatar } = req.body;

    const user = await User.findById(req.user._id);

    if (email) user.email = email;
    if (username) user.username = username;
    if (avatar) user.avatar = avatar;
    if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;
    if (isPublic !== undefined) user.isPublic = isPublic;
    if (dailyDigestTime) user.dailyDigestTime = dailyDigestTime;
    if (reminderEmail) user.reminderEmail = reminderEmail;

    if (password && newPassword) {
      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
      user.passwordHash = newPassword;
    }

    await user.save();

    res.json({
      _id: user._id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      xp: user.xp,
      level: user.level,
      badges: user.badges,
      notificationsEnabled: user.notificationsEnabled,
      isPublic: user.isPublic,
      dailyDigestTime: user.dailyDigestTime,
      reminderEmail: user.reminderEmail,
    });
  } catch (error) {
    next(error);
  }
};

// @GET /api/user/:username/public
const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username, isPublic: true }).select(
      '-passwordHash -googleId -resetPasswordToken -resetPasswordExpires -accountabilityPartners -reminderEmail'
    );

    if (!user) return res.status(404).json({ message: 'Profile not found or private' });

    const habits = await Habit.find({ userId: user._id, isDeleted: false, isArchived: false }).select(
      'name color category currentStreak longestStreak completedDates'
    );

    res.json({ user, habits });
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/user
const deleteAccount = async (req, res, next) => {
  try {
    await Habit.deleteMany({ userId: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { updateSettings, getPublicProfile, deleteAccount };
