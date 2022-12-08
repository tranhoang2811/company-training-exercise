import { inject } from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import { SecurityBindings } from '@loopback/security';
import { EUserRole } from '../constants';
import {
  Project,
  ProjectUser,
} from '../models';
import {ProjectRepository, ProjectUserRepository} from '../repositories';
import { validateUserProject } from '../services';
import set from 'lodash/set'
import { User } from '@loopback/authentication-jwt';

export class ProjectProjectUserController {
  constructor(
    @repository(ProjectRepository) protected projectRepository: ProjectRepository,
    @repository(ProjectUserRepository)
    protected projectUserRepository : ProjectUserRepository,
  ) { }

  @get('/projects/{id}/project-users', {
    responses: {
      '200': {
        description: 'Array of Project has many ProjectUser',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(ProjectUser)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<ProjectUser>,
  ): Promise<ProjectUser[]> {
    return this.projectRepository.projectUsers(id).find(filter);
  }

  @post('/projects/{id}/project-users', {
    responses: {
      '200': {
        description: 'Project model instance',
        content: {'application/json': {schema: getModelSchemaRef(ProjectUser)}},
      },
    },
  })
  async assignUser(
    @inject(SecurityBindings.USER)
    currentUser: User,
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ProjectUser, {
            title: 'AssignUserToProject',
            exclude: ['id', 'projectId'],
          }),
        },
      },
    }) projectUser: Omit<ProjectUser, 'id'>,
  ): Promise<ProjectUser> {
    const userId = currentUser?.id
    const userRole:string = await validateUserProject({
      projectId: id,
      userId: userId,
      projectUserRepository: this.projectUserRepository
    })
    if (userRole !== EUserRole.ADMIN) {
      throw new HttpErrors.Unauthorized('You are not authorized to access this resource')
    }
    // projectUser.projectId = projectId
    set(projectUser, 'projectId', id)
    return this.projectUserRepository.create(projectUser)
  }

  @patch('/projects/{id}/project-users', {
    responses: {
      '200': {
        description: 'Project.ProjectUser PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ProjectUser, {
            exclude: ['id', 'projectId'],
            partial: true
          }),
        },
      },
    })
    projectUser: Partial<ProjectUser>,
    @param.query.object('where', getWhereSchemaFor(ProjectUser)) where?: Where<ProjectUser>,
  ): Promise<Count> {
    return this.projectRepository.projectUsers(id).patch(projectUser, where);
  }

  @del('/projects/{id}/project-users', {
    responses: {
      '200': {
        description: 'Project.ProjectUser DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(ProjectUser)) where?: Where<ProjectUser>,
  ): Promise<Count> {
    return this.projectRepository.projectUsers(id).delete(where);
  }
}
