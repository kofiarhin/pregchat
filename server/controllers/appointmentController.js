const Appointment = require("../models/Appointment");
const Midwife = require("../models/Midwife");
const {
  buildAvailability,
  filterOutConflicts,
  getLondonDayBounds,
} = require("../utils/slots");

const parseIsoToDate = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const normalizeToMinute = (date) => {
  const normalized = new Date(date.getTime());
  normalized.setUTCSeconds(0, 0);
  return normalized;
};

const getMyAppointments = async (req, res, next) => {
  try {
    const userId = req.user?._id?.toString() || req.query.userId || req.body?.userId;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    const appointments = await Appointment.find({ userId })
      .sort({ start: 1 })
      .populate({
        path: "midwifeId",
        select: "name bio specialties photo appointmentDurationMin availability",
      });

    const response = appointments.map((appointment) => {
      const data = appointment.toObject();
      const { midwifeId, ...rest } = data;

      return {
        ...rest,
        midwife: midwifeId,
      };
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
};

const getAvailability = async (req, res, next) => {
  try {
    const { midwifeId, fromISO, toISO } = req.body || {};

    if (!midwifeId || !fromISO || !toISO) {
      res.status(400).json({ error: "midwifeId, fromISO, and toISO are required" });
      return;
    }

    const midwife = await Midwife.findById(midwifeId);

    if (!midwife) {
      res.status(404).json({ error: "Midwife not found" });
      return;
    }

    const from = parseIsoToDate(fromISO);
    const to = parseIsoToDate(toISO);

    if (!from || !to) {
      res.status(400).json({ error: "Invalid date range" });
      return;
    }

    if (to.getTime() < from.getTime()) {
      res.status(400).json({ error: "fromISO must be before toISO" });
      return;
    }

    const { start: rangeStart } = getLondonDayBounds(from);
    const { end: rangeEnd } = getLondonDayBounds(to);

    const existingAppointments = await Appointment.find({
      midwifeId,
      status: { $ne: "cancelled" },
      start: { $lt: rangeEnd },
      end: { $gt: rangeStart },
    });

    const candidateSlots = buildAvailability({
      midwife,
      fromDate: from,
      toDate: to,
    });

    const availableSlots = filterOutConflicts({
      candidateSlots,
      existingAppointments,
      durationMin: midwife.appointmentDurationMin,
    });

    res.json({ slots: availableSlots.map((slot) => slot.toISOString()) });
  } catch (error) {
    if (error.name === "CastError") {
      res.status(404).json({ error: "Midwife not found" });
      return;
    }

    next(error);
  }
};

const createAppointment = async (req, res, next) => {
  try {
    const { userId, userName, userEmail, midwifeId, startISO, notes } = req.body || {};

    if (!midwifeId || !startISO) {
      res.status(400).json({ error: "midwifeId and startISO are required" });
      return;
    }

    const midwife = await Midwife.findById(midwifeId);

    if (!midwife) {
      res.status(404).json({ error: "Midwife not found" });
      return;
    }

    const startDate = parseIsoToDate(startISO);

    if (!startDate) {
      res.status(400).json({ error: "Invalid start time" });
      return;
    }

    const normalizedStart = normalizeToMinute(startDate);
    const now = new Date();

    if (normalizedStart.getTime() < now.getTime()) {
      res.status(400).json({ error: "Cannot book a past time" });
      return;
    }

    const duration = Number(midwife.appointmentDurationMin) || 30;
    const endDate = new Date(normalizedStart.getTime() + duration * 60 * 1000);

    if (endDate.getTime() <= normalizedStart.getTime()) {
      res.status(400).json({ error: "Invalid appointment duration" });
      return;
    }

    const candidateSlots = buildAvailability({
      midwife,
      fromDate: normalizedStart,
      toDate: normalizedStart,
    });
    const existingAppointments = await Appointment.find({
      midwifeId,
      status: { $ne: "cancelled" },
      start: { $lt: endDate },
      end: { $gt: normalizedStart },
    });

    const availableSlots = filterOutConflicts({
      candidateSlots,
      existingAppointments,
      durationMin: duration,
    });

    const slotMatches = availableSlots.some((slot) => {
      return Math.abs(slot.getTime() - normalizedStart.getTime()) < 1000;
    });

    if (!slotMatches) {
      res.status(400).json({ error: "Selected time is no longer available" });
      return;
    }

    const appointment = await Appointment.create({
      userId,
      userName,
      userEmail,
      midwifeId,
      notes,
      start: normalizedStart,
      end: endDate,
    });

    const populated = await appointment.populate({
      path: "midwifeId",
      select: "name bio specialties photo appointmentDurationMin availability",
    });

    const data = populated.toObject();
    const { midwifeId: populatedMidwife, ...rest } = data;

    res.status(201).json({
      ...rest,
      midwife: populatedMidwife,
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "This time slot has already been booked" });
      return;
    }

    if (error.name === "CastError") {
      res.status(404).json({ error: "Midwife not found" });
      return;
    }

    next(error);
  }
};

const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id).populate({
      path: "midwifeId",
      select: "name bio specialties photo appointmentDurationMin availability",
    });

    if (!appointment) {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }

    if (appointment.status !== "cancelled") {
      appointment.status = "cancelled";
      await appointment.save();
    }

    const data = appointment.toObject();
    const { midwifeId: midwifeData, ...rest } = data;

    res.json({
      ...rest,
      midwife: midwifeData,
    });
  } catch (error) {
    if (error.name === "CastError") {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }

    next(error);
  }
};

module.exports = {
  getMyAppointments,
  getAvailability,
  createAppointment,
  cancelAppointment,
};
