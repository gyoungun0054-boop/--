export type CheckInStatus = "SUCCESS" | "ALREADY_CHECKED_IN" | "NOT_FOUND" | "ERROR";

export type Participant = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

export type CheckInLog = {
  id: string;
  participantCode: string;
  participantName: string;
  status: CheckInStatus;
  message: string;
  checkedInAt: string;
};

export type CheckInResult = {
  status: CheckInStatus;
  participant?: Participant;
  message: string;
  checkedInAt: string;
  log: CheckInLog;
};
