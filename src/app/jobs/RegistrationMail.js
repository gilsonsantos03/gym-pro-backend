import Mail from '../../lib/Mail';

class RegistrationMail {
  get key() {
    return 'RegistrationMail';
  }

  async handle({ data }) {
    const { start_date, end_date, student, price } = data;

    await Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: 'Registro de aluno',
      template: 'registration',
      context: {
        student: student.name,
        price,
        start_date,
        end_date,
      },
    });
  }
}

export default new RegistrationMail();
