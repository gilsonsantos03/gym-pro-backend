import * as Yup from 'yup';
import { Op } from 'sequelize';
import Plan from '../models/Plan';

class PlanController {
  async store(req, res) {
    try {
      const schema = Yup.object().shape({
        title: Yup.string().required(),
        duration: Yup.number().required(),
        price: Yup.number().required(),
      });

      if (!(await schema.isValid(req.body))) {
        return res.status(400).json({ error: 'Validation Fails' });
      }

      const planExists = await Plan.findOne({
        where: { title: req.body.title },
      });

      if (planExists) {
        return res.status(400).json({ error: 'Plan already exists' });
      }

      const { id, title, duration, price } = await Plan.create(req.body);

      return res.json({ id, title, duration, price });
    } catch (error) {
      // console.log(error);
      return res.status(400).json({ error: 'Something went wrong' });
    }
  }

  async index(req, res) {
    try {
      const { q = '', page = 1 } = req.query;

      // filtrando os estudantes se o query params de um nome foi passado
      const plans = q
        ? await Plan.findAll({
            where: {
              name: { [Op.like]: `%${q}%` },
            },
            attributes: ['id', 'title', 'duration', 'price'],
            // para controlar a quantidade de estudantes que será mostrado por página
            offset: (page - 1) * 10,
            limit: 10,
          })
        : await Plan.findAll({
            attributes: ['id', 'title', 'duration', 'price'],
            offset: (page - 1) * 10,
            limit: 10,
          });

      return res.json(plans);
    } catch (error) {
      // console.log(error);
      return res.status(400).json({ error: 'Something went wrong' });
    }
  }

  async show(req, res) {
    const { plan_id } = req.params;

    if (!plan_id || !plan_id.match(/^-{0,1}\d+$/)) {
      return res.status(400).json({ err: 'Plan id not provided' });
    }

    const plan = await Plan.findByPk(plan_id);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const { id, title, price, duration } = plan;

    return res.json({ id, title, price, duration });
  }

  async update(req, res) {
    try {
      const schema = Yup.object().shape({
        title: Yup.string().required(),
      });

      if (!(await schema.isValid(req.body))) {
        return res.status(400).json({ error: 'Validation Fails' });
      }

      const { plan_id } = req.params;

      if (!plan_id || !plan_id.match(/^-{0,1}\d+$/)) {
        return res.status(400).json({ err: 'Plan id not provided' });
      }

      const plan = await Plan.findByPk(plan_id);

      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const { title } = req.body;

      if (title && title !== plan.title) {
        const planExist = await Plan.findOne({ where: { title } });
        if (planExist) {
          return res.status(400).json({
            error: "There's already a plan with that name",
          });
        }
      }

      const { id, duration, price } = await plan.update(req.body);
      await plan.save();

      return res.json({ id, title, duration, price });
    } catch (error) {
      // console.log(error);
      return res.status(400).json({ error: 'Something went wrong' });
    }
  }

  async delete(req, res) {
    const { plan_id } = req.params;

    if (!plan_id || !plan_id.match(/^-{0,1}\d+$/)) {
      return res.status(400).json({ err: 'Plan id not provided' });
    }

    const plan = await Plan.findByPk(plan_id);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    await plan.destroy();

    return res.json({
      msg: `Plan - ${plan.title} deleted successfully`,
    });
  }
}

export default new PlanController();
