import * as Yup from 'yup';
import { addMonths, parseISO, format, isBefore } from 'date-fns';
import pt from 'date-fns/locale/pt';
import { Op } from 'sequelize';
import Registration from '../models/Registration';
import Student from '../models/Student';
import Plan from '../models/Plan';

import RegistrationMail from '../jobs/RegistrationMail';
import Queue from '../../lib/Queue';

class RegistrationController {
  async store(req, res) {
    try {
      const schema = Yup.object().shape({
        student_id: Yup.number().required(),
        plan_id: Yup.number().required(),
        start_date: Yup.date().required(),
      });

      if (!(await schema.isValid(req.body))) {
        return res.status(400).json({ error: 'Validation Fails' });
      }

      const { student_id, plan_id, start_date } = req.body;

      const student = await Student.findByPk(student_id, {
        attributes: ['name', 'email'],
      });

      // checa se aquele estudante existe
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const plan = await Plan.findOne({
        where: { id: plan_id },
        attributes: ['title', 'price', 'duration'],
      });

      // checa se aquele plano existe
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const existingRegistration = await Registration.findOne({
        where: { student_id },
      });

      if (existingRegistration) {
        return res
          .status(400)
          .json({ error: 'This Student already have a registration' });
      }

      const { duration, price, title } = plan;

      // convertendo a data de string pro formato do JS
      const parsedData = parseISO(start_date);

      // adicionando a duração do plano na data final da matrícula
      const end_date = addMonths(parsedData, duration);

      // calculando o preço da matrícula
      const final_price = price * duration;

      const { id } = await Registration.create({
        student_id,
        plan_id,
        start_date,
        end_date,
        price: final_price,
      });

      // enviando email com bee queue
      await Queue.add(RegistrationMail.key, {
        student,
        price,
        duration,
        title,
        start_date: format(parseISO(start_date), "'dia' dd 'de' MMMM'", {
          locale: pt,
        }),
        end_date: format(end_date, "'dia' dd 'de' MMMM'", {
          locale: pt,
        }),
      });

      return res.json({
        id,
        student_id,
        plan_id,
        price,
        start_date,
        end_date,
        plan,
        student,
      });
    } catch (error) {
      // console.log(error);
      return res.status(400).json({ error: 'Something went wrong' });
    }
  }

  async index(req, res) {
    try {
      const { q = '', page = 1 } = req.query;

      // filtrando os estudantes se o query params de um nome foi passado
      const registrations = q
        ? await Registration.findAll({
            where: {
              name: { [Op.like]: `%${q}%` },
            },
            attributes: [
              'id',
              'student_id',
              'plan_id',
              'price',
              'start_date',
              'end_date',
            ],
            // para controlar a quantidade de estudantes que será mostrado por página
            offset: (page - 1) * 10,
            limit: 10,
            include: [
              {
                model: Student,
                as: 'student',
                attributes: ['name', 'email'],
              },
              {
                model: Plan,
                as: 'plan',
                attributes: ['title', 'price', 'duration'],
              },
            ],
          })
        : await Registration.findAll({
            attributes: [
              'id',
              'student_id',
              'plan_id',
              'price',
              'start_date',
              'end_date',
            ],
            offset: (page - 1) * 10,
            limit: 10,
            include: [
              {
                model: Student,
                as: 'student',
                attributes: ['name', 'email'],
              },
              {
                model: Plan,
                as: 'plan',
                attributes: ['title', 'price', 'duration'],
              },
            ],
          });

      return res.json(registrations);
    } catch (error) {
      // console.log(error);
      return res.status(400).json({ error: 'Something went wrong' });
    }
  }

  async show(req, res) {
    const { registration_id } = req.params;

    if (!registration_id || !registration_id.match(/^-{0,1}\d+$/)) {
      return res.status(400).json({ err: 'Registration id not provided' });
    }

    const registration = await Registration.findByPk(registration_id, {
      attributes: [
        'id',
        'student_id',
        'plan_id',
        'price',
        'start_date',
        'end_date',
      ],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['title', 'price', 'duration'],
        },
      ],
    });

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    return res.json(registration);
  }

  async update(req, res) {
    try {
      const schema = Yup.object().shape({
        student_id: Yup.number().required(),
        plan_id: Yup.number().required(),
        start_date: Yup.date().required(),
      });

      // verifica se as informações foram passadas
      if (!(await schema.isValid(req.body))) {
        return res.status(400).json({ error: 'Validation Fails' });
      }

      const { registration_id } = req.params;

      // verifica se o registration_id foi inserido
      if (!registration_id || !registration_id.match(/^-{0,1}\d+$/)) {
        return res.status(400).json({ err: 'Registration id not provided' });
      }

      const registration = await Registration.findByPk(registration_id);

      // verifica se o registration_id passado existe
      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      const { plan_id, student_id, start_date } = req.body;

      const plan = await Plan.findByPk(plan_id);

      // verifica se o plano passado existe
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const student = await Student.findByPk(student_id);

      // verifica se o estudante existe
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      /*
      const existingRegistration = await Registration.findOne({
        where: { student_id },
      });

      // verifica se o estudante já possui matricula
      if (existingRegistration) {
        return res
          .status(400)
          .json({ error: 'This Student already have a registration' });
      }
      */

      const { duration, price } = plan;

      const final_price = price * duration;

      const parsedData = parseISO(start_date);

      // verifica se a data inserida na matrícula é anterior a data atual
      if (isBefore(parsedData, new Date())) {
        return res
          .status(400)
          .json({ error: 'Registrations can not be settled in past dates.' });
      }

      const end_date = addMonths(parsedData, duration);

      const { id } = await registration.update({
        student_id,
        plan_id,
        start_date,
        end_date,
        price,
      });

      await registration.save();

      return res.json({
        id,
        student_id,
        plan_id,
        price: final_price,
        start_date,
        end_date,
      });
    } catch (error) {
      // console.log(error);
      return res.status(400).json({ error: 'Something went wrong' });
    }
  }

  async delete(req, res) {
    try {
      const { registration_id } = req.params;

      // verifica se o registration_id foi inserido
      if (!registration_id || !registration_id.match(/^-{0,1}\d+$/)) {
        return res.status(400).json({ err: 'Registration id not provided' });
      }

      const registration = await Registration.findByPk(registration_id);

      // verifica se o registration_id passado existe
      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }

      await registration.destroy();

      return res.json({
        msg: `Registration deleted successfully`,
      });
    } catch (error) {
      // console.log(error);
      return res.status(400).json({ error: 'Something went wrong' });
    }
  }
}

export default new RegistrationController();
