import {Entity, model, property, hasMany, belongsTo} from '@loopback/repository';
import {Task} from './task.model';
import {ProjectUser} from './project-user.model';
import { User } from './user.model';

@model()
export class Project extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  title: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'date',
  })
  createdAt?: string;

  @property({
    type: 'date',
  })
  updatedAt?: string;

  @hasMany(() => Task)
  tasks: Task[];

  @belongsTo(() => User, {name: 'creator'})
  createdBy: User

  @belongsTo(() => User, {name: 'updater'})
  updatedBy: User

  constructor(data?: Partial<Project>) {
    super(data);
  }
}

export interface ProjectRelations {
  // describe navigational properties here
}

export type ProjectWithRelations = Project & ProjectRelations;
