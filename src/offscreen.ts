// —-----------------------------------------------------------
// – IMPORTACIONES / IMPORTS
// —---------------------------------------------------------
import { GeminiDubbingService } from "./services/geminiService";
import { DubbingState } from "./types";

// —-----------------------------------------------------------
// – INSTANCIACIÓN / INSTANTIATION
// —---------------------------------------------------------
const service = new GeminiDubbingService(
  (state) => chrome.runtime.sendMessage({ type: 'STATE_CHANGE', payload: state }),
  (error) => chrome.runtime.sendMessage({ type: 'ERROR', payload: error })
);

// —-----------------------------------------------------------
// – ESCUCHADORES DE EVENTOS / EVENT LISTENERS
// —---------------------------------------------------------
chrome.runtime.onMessage.addListener((message: any) => {
  if (message.type === 'TAB_SELECTED') {
    service.stop();
    service.start(message.payload);
  } else if (message.type === 'START_DUBBING') {
    service.start();
  } else if (message.type === 'STOP_DUBBING') {
    service.stop();
  }
});
