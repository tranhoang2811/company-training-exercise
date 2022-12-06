import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {ProjectUser, ProjectUserRelations} from '../models';

export class ProjectUserRepository extends DefaultCrudRepository<
  ProjectUser,
  typeof ProjectUser.prototype.id,
  ProjectUserRelations
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(ProjectUser, dataSource);
  }
}
