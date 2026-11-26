export interface GroupDto {
  id: string;
  subjectId: string;
  subjectTitle: string;
  name: string;
  scheduleText?: string | null;
  joinCode: string;
  isCodeActive: boolean;
  isOpen: boolean;
  studentsCount: number;
  createdAt: string;
}

export interface GroupMemberDto {
  groupId: string;
  groupName: string;
  studentId: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  parentPhoneNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: 'Male' | 'Female' | null;
  joinedAt: string;
}

export interface MyGroupDto {
  groupId: string;
  groupName: string;
  scheduleText?: string | null;
  subjectId: string;
  subjectTitle: string;
  subjectGradeLevel?: string | null;
  instructorName: string;
  joinedAt: string;
}

export interface CreateGroupDto {
  name: string;
  scheduleText?: string;
  isOpen?: boolean;
}

export interface UpdateGroupDto {
  name: string;
  scheduleText?: string;
  isOpen?: boolean;
}

export interface MoveStudentDto {
  targetGroupId: string;
}

export interface ResetStudentPasswordDto {
  newPassword: string;
}

export interface JoinGroupDto {
  code: string;
}
