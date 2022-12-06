import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, BelongsToAccessor} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {Task, TaskRelations, Project, User} from '../models';
import {ProjectRepository} from './project.repository';
import {UserRepository} from './user.repository';

export class TaskRepository extends DefaultCrudRepository<
  Task,
  typeof Task.prototype.id,
  TaskRelations
> {

  public readonly project: BelongsToAccessor<Project, typeof Task.prototype.id>;
  
  public readonly assignee: BelongsToAccessor<User, typeof User.prototype.id>

  public readonly link: BelongsToAccessor<Task, typeof Task.prototype.id>;

  public readonly creator: BelongsToAccessor<User, typeof Task.prototype.id>;

  public readonly updater: BelongsToAccessor<User, typeof Task.prototype.id>;

  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource, @repository.getter('ProjectRepository') protected projectRepositoryGetter: Getter<ProjectRepository>, @repository.getter('TaskRepository') protected taskRepositoryGetter: Getter<TaskRepository>, @repository.getter('UserRepository') protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(Task, dataSource);
    this.project = this.createBelongsToAccessorFor('project', projectRepositoryGetter,);
    this.registerInclusionResolver('project', this.project.inclusionResolver);
    this.assignee = this.createBelongsToAccessorFor('assignee', userRepositoryGetter)
    this.registerInclusionResolver('assignee', this.assignee.inclusionResolver)
    this.link = this.createBelongsToAccessorFor('link', taskRepositoryGetter)
    this.registerInclusionResolver('link', this.link.inclusionResolver)
    this.creator = this.createBelongsToAccessorFor('creator', userRepositoryGetter)
    this.registerInclusionResolver('creator', this.creator.inclusionResolver)
    this.updater = this.createBelongsToAccessorFor('updater', userRepositoryGetter)
    this.registerInclusionResolver('updater', this.updater.inclusionResolver)
  }
}
