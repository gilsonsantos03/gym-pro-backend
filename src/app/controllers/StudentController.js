import * as Yup from 'yup';
import Student from '../models/Student';

class StudentController {
  async store(req, res) {
    try {
      const schema = Yup.object().shape({
        name: Yup.string().required(),
        email: Yup.string().email().required(),
        age: Yup.number().required(),
        height: Yup.number().required(),
        weight: Yup.number().required(),
      });

      if (!(await schema.isValid(req.body))) {
        return res.status(400).json({ error: 'Validation fails' });
      }

      const studentExists = await Student.findOne({
        where: { email: req.body.email },
      });

      if (studentExists) {
        return res.status(400).json({ error: 'Student already exists' });
      }

      const { id, name, email, age, weight, height } = await Student.create(
        req.body
      );

      return res.json({ id, name, email, age, weight, height });
    } catch (error) {
      return res.status(400).json({ error: 'An error occurred' });
    }
  }

  async update(req, res) {
    try {
      const { student_id } = req.params;

      if (!student_id || !student_id.match(/^-{0,1}\d+$/))
        return res.status(400).json({ err: 'Student id not provided' });

      const student = await Student.findByPk(student_id);

      if (!student) {
        return res.status(404).json({ err: 'Student not found' });
      }

      const { email } = req.body;
      // ele só vai checar se o email antigo bate, caso ele o informe
      if (email && email !== student.email) {
        const studentExists = await Student.findOne({
          where: { email },
        });

        if (studentExists) {
          return res.status(400).json({
            error: 'A student with that email already exists',
          });
        }
      }

      const { id, name, height, weight } = await student.update(req.body);
      await student.save();

      return res.json({ id, name, email, height, weight });
    } catch (error) {
      return res.status(400).json({ error: 'An error occurred' });
    }
  }

  async index(req, res) {
    try {
      const { page = 1, perPage = 10 } = req.query;

      const students = await Student.findAll({
        attributes: ['id', 'name', 'email', 'age', 'height', 'weight'],
        // para controlar a quantidade de estudantes que serão mostrados por página
        offset: (page - 1) * perPage,
        limit: perPage,
      });

      return res.json(students);
    } catch (error) {
      return res.status(400).json({ error: 'An error occurred' });
    }
  }

  async show(req, res) {
    try {
      const { student_id } = req.params;

      if (!student_id || !student_id.match(/^-{0,1}\d+$/)) {
        return res.status(400).json({ err: 'Student id not provided' });
      }

      const student = await Student.findByPk(student_id);

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const { id, name, email, age, height, weight } = student;

      return res.json({ id, name, email, age, height, weight });
    } catch (error) {
      return res.status(400).json({ error: 'An error occurred' });
    }
  }

  async delete(req, res) {
    try {
      const { student_id } = req.params;

      if (!student_id || !student_id.match(/^-{0,1}\d+$/)) {
        return res.status(400).json({ error: 'Student id not provided' });
      }

      const student = await Student.findByPk(student_id);

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      await student.destroy();

      return res.json({
        msg: `Student - ${student.name}<${student.email}> deleted successfully`,
      });
    } catch (error) {
      return res.status(400).json({ error: 'An error occurred' });
    }
  }
}

export default new StudentController();
