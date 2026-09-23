import StudyRoom from "../models/StudyRoom.js";

export const getStudyRooms = async (req, res) => {
  try {
    const rooms = await StudyRoom.find()
      .populate("createdBy", "name")
      .sort({ updatedAt: -1 });

    res.status(200).json(
      rooms.map((room) => ({
        _id: room._id,
        name: room.name,
        topic: room.topic,
        description: room.description,
        createdBy: room.createdBy,
        memberCount: room.members.length,
        messageCount: room.messages.length,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      }))
    );
  } catch (error) {
    console.error(
      "Get study rooms error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to load study rooms",
    });
  }
};

export const createStudyRoom = async (req, res) => {
  try {
    const { name, topic, description } =
      req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Room name is required",
      });
    }

    const room = await StudyRoom.create({
      name: name.trim(),
      topic: (topic || "").trim(),
      description: (description || "").trim(),
      createdBy: req.user._id,
      members: [req.user._id],
    });

    res.status(201).json({
      message: "Study room created",
      room,
    });
  } catch (error) {
    console.error(
      "Create study room error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to create study room",
    });
  }
};

export const joinStudyRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await StudyRoom.findById(id);

    if (!room) {
      return res.status(404).json({
        message: "Study room not found",
      });
    }

    const userId = req.user._id.toString();

    if (!room.members.some((m) => m.toString() === userId)) {
      room.members.push(req.user._id);
      await room.save();
    }

    res.status(200).json({
      message: "Joined study room",
    });
  } catch (error) {
    console.error(
      "Join study room error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to join study room",
    });
  }
};

export const getRoomMessages = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await StudyRoom.findById(id)
      .populate("createdBy", "name")
      .populate("messages.user", "name");

    if (!room) {
      return res.status(404).json({
        message: "Study room not found",
      });
    }

    res.status(200).json({
      room: {
        _id: room._id,
        name: room.name,
        topic: room.topic,
        description: room.description,
        createdBy: room.createdBy,
        memberCount: room.members.length,
        createdAt: room.createdAt,
      },
      messages: room.messages,
    });
  } catch (error) {
    console.error(
      "Get room messages error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to load messages",
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const { text } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const room = await StudyRoom.findById(id);

    if (!room) {
      return res.status(404).json({
        message: "Study room not found",
      });
    }

    room.messages.push({
      user: req.user._id,
      text: text.trim(),
    });

    await room.save();

    const populated = await StudyRoom.findById(
      room._id
    ).populate("messages.user", "name");

    const lastMessage =
      populated.messages[
        populated.messages.length - 1
      ];

    res.status(201).json({
      message: "Message sent",
      msg: lastMessage,
    });
  } catch (error) {
    console.error(
      "Send message error:",
      error.message
    );

    res.status(500).json({
      message: "Failed to send message",
    });
  }
};