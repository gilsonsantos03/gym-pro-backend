import { subDays } from 'date-fns';
import { Op } from 'sequelize';
import Checkin from '../models/Checkin';
import Student from '../models/Student';

class CheckinController {
  async store(req, res) {
    try {
      const { student_id } = req.params;

      if (!student_id || !student_id.match(/^-{0,1}\d+$/)) {
        return res.status(400).json({ error: 'Student id not provided' });
      }

      const student = await Student.findByPk(student_id);

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      let checkins;
      let numberOfCheckins;

      // delimitamos um período de 7 dias
      const today = new Date();
      const seven_days_period = subDays(today, 7);

      // vai servir pra ver se existe algum checkin na base de dados
      const hasCheckin = await Checkin.findOne({
        where: { student_id },
      });

      if (hasCheckin) {
        checkins = await Checkin.findAll({
          where: {
            student_id,
            created_at: {
              // vamos pegar apenas os checkins nesse período de 7 dias
              [Op.between]: [seven_days_period, today],
            },
          },
          order: [['created_at', 'ASC']],
          attributes: ['id', 'student_id', 'checkin_message'],
        });
        // console.log(checkins);
        numberOfCheckins = checkins.length;
      } else {
        numberOfCheckins = 0;
      }

      // se a quantidade de checkins for maior que 5 ou igual, ele já chegou no limite daquele período
      if (numberOfCheckins >= 5) {
        return res
          .status(400)
          .json({ error: 'Checkin limit reached in the last 7 days' });
      }

      const { id, checkin_message } = await Checkin.create(req.params);
      return res.json({ id, student_id, checkin_message });
    } catch (error) {
      // console.log(error);
      return res.status(400).json({ error: 'Something went wrong' });
    }
  }

  async index(req, res) {
    try {
      const { student_id } = req.params;

      if (!student_id || !student_id.match(/^-{0,1}\d+$/)) {
        return res.status(400).json({ error: 'Student id not provided' });
      }

      const student = await Student.findByPk(student_id);

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const { q = '', page = 1 } = req.query;

      // filtrando os checkins se o query params de um nome foi passado
      const checkins = q
        ? await Checkin.findAll({
            where: {
              name: { [Op.like]: `%${q}%` },
            },
            attributes: ['id', 'created_at'],
            // para controlar a quantidade de checkins que será mostrado por página
            offset: (page - 1) * 7,
            limit: 7,
            include: {
              model: Student,
              as: 'student',
              attributes: ['id', 'name', 'email', 'weight', 'height', 'age'],
            },
          })
        : await Checkin.findAll({
            attributes: ['id', 'created_at'],
            offset: (page - 1) * 7,
            limit: 7,
            include: {
              model: Student,
              as: 'student',
              attributes: ['id', 'name', 'email', 'weight', 'height', 'age'],
            },
          });

      return res.json(checkins);
    } catch (error) {
      // console.log(error);
      return res.status(400).json({ error: 'Something went wrong' });
    }
  }
}

export default new CheckinController();
