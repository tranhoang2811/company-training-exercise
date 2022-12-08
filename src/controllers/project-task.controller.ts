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
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Project,
  Task,
} from '../models';
import {ProjectRepository, ProjectUserRepository, TaskRepository} from '../repositories';
import {inject} from '@loopback/core'
import {SecurityBindings} from '@loopback/security'
import { User } from '@loopback/authentication-jwt';
import {validateUserProject, validateTask} from '../services'
import { EUserRole, ETaskStatus } from '../constants';
import set from 'lodash/set'

@authenticate('jwt')
export class ProjectTaskController {
  constructor(
    @repository(ProjectRepository) protected projectRepository: ProjectRepository,
    @repository(ProjectUserRepository) protected projectUserRepository: ProjectUserRepository,
    @repository(TaskRepository) protected taskRepository: TaskRepository,
  ) { }
  
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
    currentUser: User,
    @param.path.string('projectId') projectId: string,
    @param.query.object('filter') filter?: Filter<Task>,
  ): Promise<Task[]> {
    const userRole: string = await validateUserProject({
      projectId: projectId,
      userId: currentUser?.id,
      projectUserRepository: this.projectUserRepository
    })
    if (userRole !== EUserRole.ADMIN) {
      filter = {
        where: {
          ...filter?.where,
          isCreatedByAdmin: false
        }
      }
    }
    return this.projectRepository.tasks(projectId).find(filter);
  }

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
    currentUser: User,
    @param.path.string('projectId') projectId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            title: 'NewTaskInProject',
            exclude: ['id', 'projectId', 'assignedTo', 'linkedTo', 'createdBy', 'updatedBy', 'isCreatedByAdmin', 'status', 'createdAt', 'updatedAt'],
          }),
        },
      },
    }) task: Omit<Task, 'id'>,
  ): Promise<Task> {
    const userId = currentUser?.id
    const userRole: string = await validateUserProject({
      projectId: projectId,
      userId: userId,
      projectUserRepository: this.projectUserRepository
    })
    set(task, 'isCreatedByAdmin', userRole === EUserRole.ADMIN)
    set(task, 'createdBy', userId)
    set(task, 'updatedBy', userId)
    set(task, 'createdAt', new Date())
    set(task, 'updatedAt', new Date())
    return this.projectRepository.tasks(projectId).create(task);
  }

  @patch('/projects/{projectId}/tasks/{taskId}', {
    responses: {
      '200': {
        description: 'Project.Task PATCH success count',
        content: {'application/json': {schema: getModelSchemaRef(Task, {
          exclude: ['id', 'projectId', 'isCreatedByAdmin', 'createdAt', 'updatedAt']
        })}},
      },
    },
  })
  async patch(
    @inject(SecurityBindings.USER)
    currentUser: User,
    @param.path.string('projectId') projectId: string,
    @param.path.string('taskId') taskId: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Task, {
            exclude: ['id', 'isCreatedByAdmin', 'createdAt', 'updatedAt', 'projectId', 'createdBy', 'updatedBy'],
            partial: true}),
        },
      },
    })
    newTask: Partial<Task>,
  ): Promise<Partial<Task>> {
    const userId = currentUser?.id
    const userRole: string = await validateUserProject({
      projectId: projectId,
      userId: userId,
      projectUserRepository: this.projectUserRepository
    })
    const currentTask: Task = await this.taskRepository.findById(taskId)
    const isChangeAssignedTo: boolean = newTask?.assignedTo !== undefined && newTask?.assignedTo !== currentTask.assignedTo
    const isChangeLinkedTo: boolean = newTask?.linkedTo !== undefined && newTask?.linkedTo !== currentTask.linkedTo
    if (userRole !== EUserRole.ADMIN && currentUser.id !== currentTask.assignedTo) {
      throw new HttpErrors.Unauthorized('You are not assigned to this task')
    }
    if (userRole !== EUserRole.ADMIN && (isChangeAssignedTo || isChangeLinkedTo)) {
      throw new HttpErrors.Unauthorized('You are not authorized to access this resource')
    }
    if (isChangeAssignedTo && currentTask.status === ETaskStatus.NOT_ASSIGNED_YET) {
      newTask.status = ETaskStatus.ON_PROGRESS
    }
    if (isChangeLinkedTo && newTask?.linkedTo !== undefined) {
      await validateTask({
        taskId: taskId,
        linkedId: newTask.linkedTo?.toString(),
        projectId: projectId,
        taskRepository: this.taskRepository
      })
    }
    set(newTask, 'updatedBy', userId)
    set(newTask, 'updatedAt', new Date())
    await this.taskRepository.updateById(taskId, newTask)
    return newTask;
  }

  @del('/projects/{projectId}/tasks/{taskId}', {
    responses: {
      '200': {
        description: 'Project.Task DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @inject(SecurityBindings.USER)
    currentUser: User,
    @param.path.string('projectId') projectId: string,
    @param.path.string('taskId') taskId: string,
    @param.query.object('where', getWhereSchemaFor(Task)) where?: Where<Task>,
  ): Promise<void> {
    const userRole: string = await validateUserProject({
      projectId: projectId,
      userId: currentUser.id,
      projectUserRepository: this.projectUserRepository
    })
    if (userRole !== EUserRole.ADMIN) {
      throw new HttpErrors.Unauthorized('You are not authorized to access this resource') 
    }
    this.taskRepository.deleteById(taskId);
  }
}
