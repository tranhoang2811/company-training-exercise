import {Entity, model, property} from '@loopback/repository';
import { EUserRole } from '../enums';

@model()
export class ProjectUser extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
    default: EUserRole.USER,
    jsonSchema: {
      enum: Object.values(EUserRole)
    }
  })
  role: EUserRole;


  constructor(data?: Partial<ProjectUser>) {
    super(data);
  }
}

export interface ProjectUserRelations {
  // describe navigational properties here
}

export type ProjectUserWithRelations = ProjectUser & ProjectUserRelations;
