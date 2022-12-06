import { ProjectUserRepository } from '../repositories'
import { HttpErrors } from '@loopback/rest';
import {EUserRole} from '../constants'

type TaskValidatorProps = {
    projectId: string,
    userId: string,
    projectUserRepository: ProjectUserRepository
}

type TaskValidatorResult = {
    userRole: EUserRole
}

export async function taskValidator(taskValidatorProps: TaskValidatorProps): Promise<TaskValidatorResult> {
    const {projectId, userId, projectUserRepository} = taskValidatorProps
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
    return {userRole: foundedProjectUser.role}
}