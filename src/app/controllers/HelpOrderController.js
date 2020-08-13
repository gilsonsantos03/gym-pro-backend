import { Op } from 'sequelize';
import * as Yup from 'yup';
import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';

class HelpOrderController {
  // listando todos os pedidos de auxílio sem resposta
  async index(req, res) {
    try {
      const { page = 1, perPage = 10 } = req.query;

      const help_orders = await HelpOrder.findAll({
        where: {
          answer_at: {
            [Op.is]: null,
          },
        },
        attributes: ['id', 'question', 'answer', 'answer_at'],
        // para controlar a quantidade de help_orders que será mostrado por página
        offset: (page - 1) * perPage,
        limit: perPage,
        include: {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        order: [['created_at', 'ASC']],
      });

      return res.json(help_orders);
    } catch (error) {
      // console.log(error);
      return res.status(400).json({ error: 'Something went wrong' });
    }
  }

  // listando todos os pedidos de auxílio de um aluno com base no seu id de cadastro
  async show(req, res) {
    try {
      const { student_id } = req.params;

      if (!student_id || !student_id.match(/^-{0,1}\d+$/)) {
        return res.status(400).json({ error: 'Student id not provided' });
      }

      const student = await Student.findByPk(student_id);

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const { page = 1, perPage = 10 } = req.query;

      const help_orders = await HelpOrder.findAll({
        where: {
          student_id,
        },
        attributes: ['id', 'question', 'answer', 'answer_at'],
        // para controlar a quantidade de pedidos de auxílio que serão mostrados por página
        offset: (page - 1) * perPage,
        limit: perPage,
        include: {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        order: [['created_at', 'ASC']],
      });

      return res.json(help_orders);
    } catch (error) {
      // console.log(error);
      return res.status(400).json({ error: 'Something went wrong' });
    }
  }

  // rota para o aluno criar os pedidos de auxílio
  async store(req, res) {
    try {
      const schema = Yup.object().shape({
        question: Yup.string().required(),
      });

      if (!(await schema.isValid(req.body))) {
        return res.status(400).json({ error: 'Validation fails' });
      }

      const { student_id } = req.params;

      if (!student_id || !student_id.match(/^-{0,1}\d+$/)) {
        return res.status(400).json({ error: 'Student id not provided' });
      }

      const student = await Student.findByPk(student_id);

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const { id, question } = await HelpOrder.create({
        student_id: req.params.student_id,
        question: req.body.question,
      });

      return res.json({ id, student_id, question });
    } catch (error) {
      // console.log(error);
      return res.status(400).json({ error: 'Something went wrong' });
    }
  }
}

export default new HelpOrderController();
