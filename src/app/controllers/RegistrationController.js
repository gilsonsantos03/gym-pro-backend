import * as Yup from 'yup';
import { addMonths, parseISO, format } from 'date-fns';
import pt from 'date-fns/locale/pt';
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
        attributes: ['id', 'title', 'price', 'duration'],
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

      const { duration, price } = plan;

      // convertendo a data de string pro formato do JS
      const parsedData = parseISO(start_date);

      // adicionando a duração do plano na data final da matrícula
      const end_date = addMonths(parsedData, duration);

      // calculando o preço da matrícula
      const finalPrice = price * duration;

      const { id } = await Registration.create({
        student_id,
        plan_id,
        start_date,
        end_date,
        price: finalPrice,
      });

      // enviando email com bee queue
      await Queue.add(RegistrationMail.key, {
        student,
        price,
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
}

export default new RegistrationController();
