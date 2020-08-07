import Mail from '../../lib/Mail';

class RegistrationMail {
  get key() {
    return 'RegistrationMail';
  }

  async handle({ data }) {
    const { start_date, end_date, student, price, duration, title } = data;

    await Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: 'Registro de aluno',
      template: 'registration',
      context: {
        student: student.name,
        price,
        duration,
        title,
        start_date,
        end_date,
      },
    });
  }
}

export default new RegistrationMail();
