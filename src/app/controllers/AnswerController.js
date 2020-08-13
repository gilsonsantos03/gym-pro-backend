import * as Yup from 'yup';
import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';
import Queue from '../../lib/Queue';
import AnswerMail from '../jobs/AnswerMail';

class AnswerController {
  async store(req, res) {
    try {
      const schema = Yup.object().shape({
        answer: Yup.string().required(),
      });

      if (!(await schema.isValid(req.body))) {
        return res.status(400).json({ error: 'Validation fails' });
      }

      const { help_order_id } = req.params;

      if (!help_order_id || !help_order_id.match(/^-{0,1}\d+$/)) {
        return res.status(400).json({ error: 'Help Order id not provided' });
      }

      const { answer } = req.body;

      const help_order = await HelpOrder.findByPk(help_order_id, {
        attributes: ['id', 'question', 'answer', 'answer_at'],
        include: {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        order: [['created_at', 'ASC']],
      });

      if (!help_order) {
        return res.status(404).json({ error: 'Help Order not found' });
      }

      const { question, answer_at, student } = await help_order.update({
        answer,
        answer_at: new Date(),
      });

      await help_order.save();

      // enviando email com bee queue
      await Queue.add(AnswerMail.key, {
        student,
        question,
        answer,
        answer_at: format(answer_at, "'dia' dd 'de' MMMM'", {
          locale: pt,
        }),
      });

      return res.json(help_order);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ error: 'Something went wrong' });
    }
  }
}

export default new AnswerController();
