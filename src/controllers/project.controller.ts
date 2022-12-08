import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import {Project, ProjectUser} from '../models';
import {ProjectRepository, ProjectUserRepository} from '../repositories';
import { authenticate } from '@loopback/authentication';
import { EUserRole } from '../constants';
import {inject} from '@loopback/core'
import {SecurityBindings} from '@loopback/security'
import { User } from '@loopback/authentication-jwt';
import { validateUserProject } from '../services';
import set from 'lodash/set'

@authenticate('jwt')
export class ProjectController {
  constructor(
    @repository(ProjectRepository)
    public projectRepository : ProjectRepository,
    @repository(ProjectUserRepository)
    public projectUserRepository : ProjectUserRepository,
  ) {}

  @post('/projects')
  @response(200, {
    description: 'Project model instance',
    content: {'application/json': {schema: getModelSchemaRef(Project)}},
  })
  async create(
    @inject(SecurityBindings.USER)
    currentUser: User,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Project, {
            title: 'NewProject',
            exclude: ['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'],
          }),
        },
      },
    })
    project: Omit<Project, 'id'>,
  ): Promise<Project> {
    const userId = currentUser?.id
    set(project, 'createdBy', userId)
    set(project, 'updatedBy', userId)
    set(project, 'createdAt', new Date())
    set(project, 'updatedAt', new Date())
    const newProject = await this.projectRepository.create(project)
    await this.projectUserRepository.create({
      role: EUserRole.ADMIN,
      projectId: newProject.id,
      userId: userId
    })
    return newProject;
  }

  @post('/projects/{projectId}/project-users', {
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
    @param.path.string('projectId') projectId: string,
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
      projectId: projectId,
      userId: userId,
      projectUserRepository: this.projectUserRepository
    })
    if (userRole !== EUserRole.ADMIN) {
      throw new HttpErrors.Unauthorized('You are not authorized to access this resource')
    }
    // projectUser.projectId = projectId
    set(projectUser, 'projectId', projectId)
    return this.projectUserRepository.create(projectUser)
  }
  
  @get('/projects/count')
  @response(200, {
    description: 'Project model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Project) where?: Where<Project>,
  ): Promise<Count> {
    return this.projectRepository.count(where);
  }

  @get('/projects')
  @response(200, {
    description: 'Array of Project model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Project, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Project) filter?: Filter<Project>,
  ): Promise<Project[]> {
    return this.projectRepository.find(filter);
  }

  @patch('/projects')
  @response(200, {
    description: 'Project PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Project, {partial: true}),
        },
      },
    })
    project: Project,
    @param.where(Project) where?: Where<Project>,
  ): Promise<Count> {
    return this.projectRepository.updateAll(project, where);
  }

  @get('/projects/{id}')
  @response(200, {
    description: 'Project model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Project, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Project, {exclude: 'where'}) filter?: FilterExcludingWhere<Project>
  ): Promise<Project> {
    return this.projectRepository.findById(id, filter);
  }

  @patch('/projects/{id}')
  @response(204, {
    description: 'Project PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Project, {partial: true}),
        },
      },
    })
    project: Project,
  ): Promise<void> {
    await this.projectRepository.updateById(id, project);
  }

  @put('/projects/{id}')
  @response(204, {
    description: 'Project PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() project: Project,
  ): Promise<void> {
    await this.projectRepository.replaceById(id, project);
  }

  @del('/projects/{id}')
  @response(204, {
    description: 'Project DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.projectRepository.deleteById(id);
  }
}
