const Note = require('../models/Note');

// @GET /api/notes
const getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    next(error);
  }
};

// @POST /api/notes
const createNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const note = await Note.create({ userId: req.user._id, content });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

// @DELETE /api/notes/:id
const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotes, createNote, deleteNote };
