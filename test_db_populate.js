const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({ email: String, phone: String });
const clinicSchema = new Schema({ name: String });

const appointmentSchema = new Schema({
    clinicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: Date,
    status: String,
    patientName: String,
    doctorName: String,
    noShowProbability: Number
});

const User = mongoose.model('User', userSchema, 'users');
const Clinic = mongoose.model('Clinic', clinicSchema, 'clinics');
const Appointment = mongoose.model('Appointment', appointmentSchema, 'appointments');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/medaichain', { useNewUrlParser: true, useUnifiedTopology: true });
  try {
      const clinicId = new mongoose.Types.ObjectId('69a2ff0f55b4e231354a5424');
      const appts = await Appointment.find({ clinicId })
            .populate('doctorId', 'email phone')
            .populate('patientId', 'email phone')
            .exec();
      console.log('Appts length:', appts.length);
      console.log('Last appt populated patientId:', appts[appts.length - 1].patientId);
  } catch (err) {
      console.error('CRASH:', err.message);
  }
  process.exit(0);
}
test().catch(console.dir);
