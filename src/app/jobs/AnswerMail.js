import Mail from '../../lib/Mail';

class AnswerMail {
  get key() {
    return 'AnswerMail';
  }

  async handle({ data }) {
    const { answer_at, answer, question, student } = data;

    await Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: 'Resposta da academia',
      template: 'answer',
      context: {
        student: student.name,
        question,
        answer,
        answer_at,
      },
    });
  }
}

export default new AnswerMail();
