export const routes = {
  workspace:      (wid: string)                           => `/w/${wid}`,
  space:          (wid: string, sid: string)              => `/w/${wid}/spaces/${sid}`,
  spaceTasks:     (wid: string, sid: string)              => `/w/${wid}/spaces/${sid}/tasks`,
  spaceTask:      (wid: string, sid: string, tid: string) => `/w/${wid}/spaces/${sid}/tasks/${tid}`,
  spaceNotes:     (wid: string, sid: string)              => `/w/${wid}/spaces/${sid}/notes`,
  spaceTeams:     (wid: string, sid: string)              => `/w/${wid}/spaces/${sid}/teams`,
  spaceTeam:      (wid: string, sid: string, tid: string) => `/w/${wid}/spaces/${sid}/teams/${tid}`,
  spaceSettings:  (wid: string, sid: string)              => `/w/${wid}/spaces/${sid}/settings`,
  spaceEpics:     (wid: string, sid: string)              => `/w/${wid}/spaces/${sid}/epics`,
  spaceEpic:      (wid: string, sid: string, eid: string) => `/w/${wid}/spaces/${sid}/epics/${eid}`,
};
