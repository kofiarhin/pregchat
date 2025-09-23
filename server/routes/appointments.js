const express = require("express");
const {
  getMyAppointments,
  getAvailability,
  createAppointment,
  cancelAppointment,
} = require("../controllers/appointmentController");

const router = express.Router();

router.get("/my", getMyAppointments);
router.post("/availability", getAvailability);
router.post("/", createAppointment);
router.delete("/:id", cancelAppointment);

module.exports = router;
