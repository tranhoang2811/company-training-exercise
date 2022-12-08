import { HttpErrors } from "@loopback/rest";
import * as isEmail from 'isemail'
import {Credentials, ProjectRepository, TaskRepository} from '../repositories/index'
import { ProjectUserRepository } from '../repositories'
import {EUserRole} from '../constants'
import { Task } from "../models";

export function validateCredentials(credentials: Credentials) {
    if (!isEmail.validate(credentials.email)) {
        throw new HttpErrors.UnprocessableEntity('invalid email')
    }
}

type UserProjectValidationProps = {
    projectId: string,
    userId: string,
    projectUserRepository: ProjectUserRepository
}

type UserProjectValidationResult = {
    userRole: EUserRole
}

// Validate user's project
export async function validateUserProject(userProjectValidationProps: UserProjectValidationProps): Promise<string> {
    const {projectId, userId, projectUserRepository} = userProjectValidationProps
    const foundedProjectUser = await projectUserRepository.findOne({
        where: {
            projectId: projectId
        }
    })

    if (!foundedProjectUser) {
        throw new HttpErrors.NotFound('Project not found')
    }
    if (foundedProjectUser?.userId.toString() !== userId) {
        throw new HttpErrors.NotFound('User not found in project')
    }
    return foundedProjectUser.role.toString()
}

type TaskValidationProps = {
    taskId: string,
    linkedId: string,
    projectId: string,
    taskRepository: TaskRepository
}

export async function validateTask(taskValidationProps: TaskValidationProps): Promise<void>{
    const {taskId, linkedId, projectId, taskRepository} = taskValidationProps
    const foundTask = await taskRepository.findById(linkedId)
    if (!foundTask) {
        throw new HttpErrors.NotFound('Not found linked task')
    }
    if (foundTask.projectId.toString() !== projectId) {
        throw new HttpErrors.Unauthorized('You can not link tasks between different projects')
    }
    if (foundTask.id?.toString() === taskId) {
        throw new HttpErrors.Unauthorized('You can not link task with it self')
    }
}