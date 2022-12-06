import {
  repository,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
} from '@loopback/rest';
import {
  ProjectUser,
  User,
} from '../models';
import {ProjectUserRepository} from '../repositories';
import { authenticate } from '@loopback/authentication';

export class ProjectUserUserController {
  constructor(
    @repository(ProjectUserRepository)
    public projectUserRepository: ProjectUserRepository,
  ) { }

  @authenticate('jwt')
  @get('/project-users/{id}/user', {
    responses: {
      '200': {
        description: 'User belonging to ProjectUser',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(User)},
          },
        },
      },
    },
  })
  async getUser(
    @param.path.string('id') id: typeof ProjectUser.prototype.id,
  ): Promise<User> {
    return this.projectUserRepository.user(id);
  }
}
