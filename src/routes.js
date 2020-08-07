import { Router } from 'express';

import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';

import authMiddleware from './app/middlewares/auth';
import StudentController from './app/controllers/StudentController';
import PlanController from './app/controllers/PlanController';
import RegistrationController from './app/controllers/RegistrationController';

const routes = new Router();

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

routes.use(authMiddleware);

routes.put('/users', UserController.update);

// rotas do estudante
routes.post('/students', StudentController.store);
routes.put('/students/:student_id', StudentController.update);
routes.get('/students/:student_id', StudentController.show);
routes.get('/students', StudentController.index);
routes.delete('/students/:student_id', StudentController.delete);

// rotas do plano
routes.post('/plans', PlanController.store);
routes.get('/plans', PlanController.index);
routes.get('/plans/:plan_id', PlanController.show);
routes.put('/plans/:plan_id', PlanController.update);
routes.delete('/plans/:plan_id', PlanController.delete);

// rotas de matrícula
routes.post('/registrations', RegistrationController.store);
routes.get('/registrations', RegistrationController.index);
routes.get('/registrations/:registration_id', RegistrationController.show);

export default routes;
