// —-----------------------------------------------------------
// – IMPORTACIONES / IMPORTS
// —---------------------------------------------------------
import { DubbingMessage } from './types';

// —-----------------------------------------------------------
// – ESCUCHADORES DE EVENTOS / EVENT LISTENERS
// —---------------------------------------------------------
chrome.runtime.onMessage.addListener((message: DubbingMessage, sender, sendResponse) => {
  if (message.type === 'START_DUBBING') {
    startOffscreen();
  } else if (message.type === 'STOP_DUBBING') {
    stopOffscreen();
  } else if (message.type === 'SELECT_TAB') {
    chrome.desktopCapture.chooseDesktopMedia(['tab'], sender.tab, (streamId) => {
      if (streamId) {
        chrome.runtime.sendMessage({ type: 'TAB_SELECTED', payload: streamId });
      }
    });
  }
});

// —-----------------------------------------------------------
// – FUNCIONES AUXILIARES / HELPER FUNCTIONS
// —---------------------------------------------------------
async function startOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;

  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK, chrome.offscreen.Reason.USER_MEDIA],
    justification: 'Capturing tab audio for real-time AI dubbing processing.',
  });
}

async function stopOffscreen() {
  if (!(await chrome.offscreen.hasDocument())) return;
  await chrome.offscreen.closeDocument();
}
