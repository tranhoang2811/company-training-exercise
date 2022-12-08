import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory, BelongsToAccessor} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {Project, ProjectRelations, Task, User, ProjectUser} from '../models';
import {TaskRepository} from './task.repository';
import { UserRepository } from './user.repository';
import {ProjectUserRepository} from './project-user.repository';

export class ProjectRepository extends DefaultCrudRepository<
  Project,
  typeof Project.prototype.id,
  ProjectRelations
> {

  public readonly tasks: HasManyRepositoryFactory<Task, typeof Project.prototype.id>;

  public readonly creator: BelongsToAccessor<User, typeof Project.prototype.id>;

  public readonly updater: BelongsToAccessor<User, typeof Project.prototype.id>;

  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource, @repository.getter('TaskRepository') protected taskRepositoryGetter: Getter<TaskRepository>, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>, @repository.getter('ProjectUserRepository') protected projectUserRepositoryGetter: Getter<ProjectUserRepository>,
  ) {
    super(Project, dataSource);
    this.tasks = this.createHasManyRepositoryFactoryFor('tasks', taskRepositoryGetter,);
    this.registerInclusionResolver('tasks', this.tasks.inclusionResolver);
    this.creator = this.createBelongsToAccessorFor('creator', userRepositoryGetter)
    this.registerInclusionResolver('creator', this.creator.inclusionResolver)
    this.updater = this.createBelongsToAccessorFor('updater', userRepositoryGetter)
    this.registerInclusionResolver('updater', this.updater.inclusionResolver)
  }
}
