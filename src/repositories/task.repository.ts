import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongoDataSource} from '../datasources';
import {Task, TaskRelations} from '../models';

export class TaskRepository extends DefaultCrudRepository<
  Task,
  typeof Task.prototype.id,
  TaskRelations
> {
  constructor(
    @inject('datasources.mongo') dataSource: MongoDataSource,
  ) {
    super(Task, dataSource);
  }
}
