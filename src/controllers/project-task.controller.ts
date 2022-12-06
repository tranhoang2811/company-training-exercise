import { authenticate } from '@loopback/authentication';
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
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Project,
  Task,
} from '../models';
import {ProjectRepository, ProjectUserRepository} from '../repositories';
import {inject} from '@loopback/core'
import {SecurityBindings} from '@loopback/security'
import { User } from '@loopback/authentication-jwt';
import {taskValidator} from '../services'
import { EUserRole } from '../constants';

export class ProjectTaskController {
  constructor(
    @repository(ProjectRepository) protected projectRepository: ProjectRepository,
    @repository(ProjectUserRepository) protected projectUserRepository: ProjectUserRepository,
  ) { }
  
  @authenticate('jwt')
  @get('/projects/{projectId}/tasks', {
    responses: {
      '200': {
        description: 'Array of Project has many Task',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Task)},
          },
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER)
    currentUserProfile: User,
    @param.path.string('projectId') projectId: string,
    @param.query.object('filter') filter?: Filter<Task>,
  ): Promise<Task[]> {
    const validator = await taskValidator({
      projectId: projectId,
      userId: currentUserProfile.id,
      projectUserRepository: this.projectUserRepository
    })
    if (validator.userRole.toString() !== EUserRole.ADMIN) {
      filter = {
        where: {
          ...filter?.where,
          assignedTo: currentUserProfile.id
        }
      }
    }
    return this.projectRepository.tasks(projectId).find(filter);
  }

  @authenticate('jwt')
  @post('/projects/{projectId}/tasks', {
    responses: {
      '200': {
        description: 'Project model instance',
        content: {'application/json': {schema: getModelSchemaRef(Task)}},
      },
    },
  })
  async create(
    @inject(SecurityBindings.USER)
    currentUserProfile: User,
    @param.path.string('projectId') projectId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            title: 'NewTaskInProject',
            exclude: ['id'],
            optional: ['projectId']
          }),
        },
      },
    }) task: Omit<Task, 'id'>,
  ): Promise<Task> {
    const validator = await taskValidator({
      projectId: projectId,
      userId: currentUserProfile.id,
      projectUserRepository: this.projectUserRepository
    })
    task.isCreatedByAdmin = validator.userRole.toString() === EUserRole.ADMIN
    task.createdBy = currentUserProfile.id
    return this.projectRepository.tasks(projectId).create(task);
  }

  @authenticate('jwt')
  @patch('/projects/{projectId}/tasks/{taskId}', {
    responses: {
      '200': {
        description: 'Project.Task PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @inject(SecurityBindings.USER)
    currentUserProfile: User,
    @param.path.string('projectId') projectId: string,
    @param.path.string('taskId') taskId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {partial: true}),
        },
      },
    })
    task: Partial<Task>,
  ): Promise<Count> {
    const validator = await taskValidator({
      projectId: projectId,
      userId: currentUserProfile.id,
      projectUserRepository: this.projectUserRepository
    })
    const userRole = validator.userRole.toString()
    console.log(task)
    return this.projectRepository.tasks(projectId).patch(task);
  }

  @authenticate('jwt')
  @del('/projects/{id}/tasks', {
    responses: {
      '200': {
        description: 'Project.Task DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Task)) where?: Where<Task>,
  ): Promise<Count> {
    return this.projectRepository.tasks(id).delete(where);
  }
}
