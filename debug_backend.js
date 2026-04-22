const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const userSchema = new Schema({ email: String, phone: String });
const clinicSchema = new Schema({ name: String });
const appointmentSchema = new Schema({
    clinicId: { type: Types.ObjectId, ref: 'Clinic' },
    doctorId: { type: Types.ObjectId, ref: 'User' },
    patientId: { type: Types.ObjectId, ref: 'User' },
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
  await mongoose.connect('mongodb://127.0.0.1:27017/medaichain');
  try {
      const clinicId = '69a2ff0f55b4e231354a5424';
      const filters = {};
      const query = { clinicId: new Types.ObjectId(clinicId) };

      const appts = await Appointment.find(query)
            .populate('doctorId', 'email phone')
            .populate('patientId', 'email phone')
            .sort({ date: 1, timeSlot: 1 })
            .exec();
      
      console.log('JSON Output:', JSON.stringify(appts[0]));
      console.log('SUCCESS: All appts loaded and populated!');
  } catch (err) {
      console.error('CRASH IN BACKEND LOGIC:', err.stack);
  }
  process.exit(0);
}
test().catch(console.dir);
