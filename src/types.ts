// —-----------------------------------------------------------
// – ENUMERACIONES / ENUMS
// —---------------------------------------------------------
export enum DubbingState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR'
}

// —-----------------------------------------------------------
// – INTERFACES / INTERFACES
// —---------------------------------------------------------
export interface DubbingMessage {
  type: 'START_DUBBING' | 'STOP_DUBBING' | 'STATE_CHANGE' | 'ERROR' | 'SELECT_TAB' | 'TAB_SELECTED';
  payload?: any;
}
