const APPS_SCRIPT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxkcmBTQPP_u5_KGWfRHHxwIQFNelOUgI2NdS3navlKpcfWFpYP_GZfIa1IbCIJx_GAYQ/exec';

const traditions = [
  { name: '18 Candles', icon: '🕯', attendees: ['Sample guest 1', 'Sample guest 2', 'Sample guest 3'], meaning: 'Eighteen candles represent the light, love, and guidance Merian carries into this next chapter. Each candle is a wish from someone who holds her dear.' },
  { name: '18 Shots', icon: '🥂', attendees: ['Sample guest 1', 'Sample guest 2', 'Sample guest 3'], meaning: 'A sparkling toast to eighteen years of laughter, friendship, and all the wonderful memories still to come. Raise a glass and celebrate together.' },
  { name: '18 Roses', icon: '❀', meaning: 'Eighteen roses are shared with the important people in Merian’s life—each one a little reminder of love, respect, and a special bond.' },
  { name: '18 Treasures', icon: '🎁', attendees: ['Sample guest 1', 'Sample guest 2', 'Sample guest 3'], meaning: 'Eighteen thoughtful keepsakes represent the treasured lessons, dreams, and tokens of affection that Merian will carry with her.' },
  { name: 'Message of Love', icon: '♡', meaning: 'A few heartfelt words can become a memory for a lifetime. Share a wish, a favorite story, or a little encouragement for the birthday girl.' }
];

const traditionGrid = document.querySelector('#traditions-grid');
const traditionModal = document.querySelector('#tradition-modal');
const toast = document.querySelector('#toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

traditions.forEach((item, index) => {
  const button = document.createElement('button');
  button.className = 'tradition-card';
  button.type = 'button';
  button.setAttribute('aria-label', `Learn about ${item.name}`);
  button.innerHTML = `<span class="tradition-icon" aria-hidden="true">${item.icon}</span><strong>${item.name}</strong><small>DISCOVER MORE　↗</small>`;
  button.addEventListener('click', () => {
    document.querySelector('#tradition-kicker').textContent = `TRADITION ${String(index + 1).padStart(2, '0')} OF ${traditions.length}`;
    document.querySelector('#tradition-number').textContent = String(index + 1).padStart(2, '0');
    document.querySelector('#tradition-title').textContent = item.name;
    document.querySelector('#tradition-description').textContent = item.meaning;
    const roster = document.querySelector('#tradition-roster');
    const attendeeList = document.querySelector('#tradition-attendees');
    attendeeList.replaceChildren();
    roster.hidden = !item.attendees;
    (item.attendees || []).forEach(name => {
      const attendee = document.createElement('li');
      attendee.textContent = name;
      attendeeList.append(attendee);
    });
    traditionModal.showModal();
  });
  traditionGrid.append(button);
});

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('#site-nav');
menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  siteNav.classList.toggle('is-open', !isOpen);
});
siteNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
  siteNav.classList.remove('is-open');
}));

document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  event.preventDefault();
  history.pushState(null, '', link.getAttribute('href'));
  target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}));

async function sendToAppsScript(payload) {
  if (!APPS_SCRIPT_ENDPOINT) {
    throw new Error('The Google Apps Script deployment URL has not been added yet. Follow the setup steps in README.md.');
  }
  await fetch(APPS_SCRIPT_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
}

const rsvpForm = document.querySelector('#rsvp-form');
const rsvpFeedback = document.querySelector('#rsvp-feedback');
rsvpForm.addEventListener('submit', async event => {
  event.preventDefault();
  const submitButton = rsvpForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  rsvpFeedback.textContent = 'Sending your confirmation…';
  try {
    await sendToAppsScript({
      action: 'rsvp',
      name: rsvpForm.elements.name.value.trim(),
      confirmation: rsvpForm.elements.confirmation.value.trim()
    });
    rsvpFeedback.textContent = 'Your confirmation was sent, SEE YOU!!!';
    showToast('Your attendance confirmation was sent ♡');
    rsvpForm.reset();
  } catch (error) {
    rsvpFeedback.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelectorAll('[data-modal]').forEach(button => {
  button.addEventListener('click', () => document.getElementById(button.dataset.modal).showModal());
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelectorAll('.modal-close, .modal-done').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
});

const photoFiles = document.querySelector('#photo-files');
const cameraFile = document.querySelector('#camera-file');
const photoFeedback = document.querySelector('#photo-feedback');
const maxPhotoBytes = 8 * 1024 * 1024;
const maxPhotosPerBatch = 5;

document.querySelector('#upload-photos').addEventListener('click', () => photoFiles.click());
document.querySelector('#take-photo').addEventListener('click', () => cameraFile.click());
photoFiles.addEventListener('change', () => uploadPhotos(photoFiles.files, photoFiles));
cameraFile.addEventListener('change', () => uploadPhotos(cameraFile.files, cameraFile));

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(new Error(`Could not read ${file.name}. Please try again.`)));
    reader.readAsDataURL(file);
  });
}

async function uploadPhotos(fileList, input) {
  const files = Array.from(fileList);
  input.value = '';
  if (!files.length) return;
  if (files.length > maxPhotosPerBatch) {
    photoFeedback.textContent = `Please select no more than ${maxPhotosPerBatch} photos at a time.`;
    return;
  }
  const invalidFile = files.find(file => !file.type.startsWith('image/') || file.size > maxPhotoBytes);
  if (invalidFile) {
    photoFeedback.textContent = `${invalidFile.name} is not an image or is larger than 8 MB. Please choose a smaller image.`;
    return;
  }

  const uploadButtons = document.querySelectorAll('#upload-photos, #take-photo');
  uploadButtons.forEach(button => { button.disabled = true; });
  try {
    for (const [index, file] of files.entries()) {
      photoFeedback.textContent = `Sending photo ${index + 1} of ${files.length}…`;
      const dataUrl = await readFileAsDataUrl(file);
      await sendToAppsScript({
        action: 'upload',
        name: file.name,
        mimeType: file.type,
        data: dataUrl.split(',')[1]
      });
    }
    const successMessage = files.length === 1 ? 'Photo uploaded successfully!' : 'Photos uploaded successfully!';
    photoFeedback.textContent = successMessage;
    showToast(successMessage);
  } catch (error) {
    photoFeedback.textContent = error.message;
  } finally {
    uploadButtons.forEach(button => { button.disabled = false; });
  }
}

document.querySelector('#copy-details').addEventListener('click', async () => {
  const details = 'Merian’s 18th Birthday · Sunday, October 25, 2026 · 5:00 PM onwards · The Haven Events Place · Dress code: Black semi-formal';
  try {
    await navigator.clipboard.writeText(details);
    showToast('Event details copied to your clipboard.');
  } catch (error) {
    showToast(details);
  }
});

const countdown = document.querySelector('#countdown');
const eventDate = new Date(2026, 9, 25, 17, 0, 0);
function updateCountdown() {
  let remaining = Math.max(0, eventDate.getTime() - Date.now());
  const days = Math.floor(remaining / 86400000);
  remaining %= 86400000;
  const hours = Math.floor(remaining / 3600000);
  remaining %= 3600000;
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const values = [days, hours, minutes, seconds];
  countdown.querySelectorAll('strong').forEach((node, index) => {
    node.textContent = String(values[index]).padStart(2, '0');
  });
  if (eventDate.getTime() <= Date.now()) {
    document.querySelector('.countdown-panel .section-kicker').textContent = 'TONIGHT WE CELEBRATE';
  }
}
updateCountdown();
window.setInterval(updateCountdown, 1000);

const playlistButton = document.querySelector('#playlist-button');
const playlistLabel = document.querySelector('#playlist-label');
const audioCaption = document.querySelector('#audio-caption');
let audioContext;
let birthdayTune;
let tuneStarting = false;
const melody = [67, null, 72, 74, 76, null, 74, 72, 69, null, 72, 74, 76, 79, 76, null, 72, null, 76, 79, 81, null, 79, 76, 74, null, 72, 74, 72, 69, 67, null];
function midiFrequency(note) {
  return 440 * 2 ** ((note - 69) / 12);
}
function createBirthdayTune() {
  const sampleRate = audioContext.sampleRate;
  const beatDuration = 60 / 118;
  const stepDuration = beatDuration / 2;
  const noteLength = Math.floor(sampleRate * stepDuration);
  const buffer = audioContext.createBuffer(1, noteLength * melody.length, sampleRate);
  const samples = buffer.getChannelData(0);
  const bars = [
    { bass: 36, chord: [60, 64, 67] },
    { bass: 31, chord: [59, 62, 67] },
    { bass: 33, chord: [57, 60, 64] },
    { bass: 29, chord: [57, 60, 65] }
  ];

  function addTone(start, duration, frequency, volume, harmonics = false) {
    const firstSample = Math.floor(start * sampleRate);
    const length = Math.floor(duration * sampleRate);
    for (let i = 0; i < length && firstSample + i < samples.length; i += 1) {
      const time = i / sampleRate;
      const envelope = Math.min(time / 0.008, 1) * Math.min((duration - time) / 0.035, 1);
      const fundamental = Math.sin(2 * Math.PI * frequency * time);
      const overtone = harmonics ? Math.sin(4 * Math.PI * frequency * time) * 0.25 : 0;
      samples[firstSample + i] += (fundamental + overtone) * Math.max(envelope, 0) * volume;
    }
  }

  melody.forEach((note, step) => {
    const start = step * stepDuration;
    const bar = bars[Math.floor(step / 8)];
    const beat = step % 8;

    if (note !== null) addTone(start, stepDuration * 0.82, midiFrequency(note), 0.075, true);
    if (beat % 2 === 0) {
      addTone(start, beatDuration * 0.88, midiFrequency(bar.bass), 0.12);
      bar.chord.forEach(chordNote => addTone(start, beatDuration * 0.72, midiFrequency(chordNote + 12), 0.022));

      const kickLength = Math.floor(sampleRate * 0.14);
      const kickStart = Math.floor(start * sampleRate);
      for (let i = 0; i < kickLength && kickStart + i < samples.length; i += 1) {
        const time = i / sampleRate;
        const envelope = Math.exp(-time * 24);
        const frequency = 115 - 65 * (time / 0.14);
        samples[kickStart + i] += Math.sin(2 * Math.PI * frequency * time) * envelope * 0.18;
      }

      if (beat === 2 || beat === 6) {
        const clapLength = Math.floor(sampleRate * 0.12);
        const clapStart = Math.floor(start * sampleRate);
        for (let i = 0; i < clapLength && clapStart + i < samples.length; i += 1) {
          const envelope = Math.exp(-(i / sampleRate) * 32);
          const noise = Math.sin(i * 12.9898) * Math.sin(i * 78.233);
          samples[clapStart + i] += noise * envelope * 0.055;
        }
      }
    }

    const hatStart = Math.floor(start * sampleRate);
    const hatLength = Math.floor(sampleRate * 0.035);
    for (let i = 0; i < hatLength && hatStart + i < samples.length; i += 1) {
      const envelope = Math.exp(-(i / sampleRate) * 100);
      samples[hatStart + i] += Math.sin((hatStart + i) * 17.31) * envelope * 0.018;
    }
  });

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(audioContext.destination);
  return source;
}
async function startBirthdayTune(showError = false) {
  if (tuneStarting || birthdayTune) return;
  tuneStarting = true;
  try {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextConstructor) throw new Error('Audio is not supported here.');
    audioContext ||= new AudioContextConstructor();
    await audioContext.resume();
    if (audioContext.state !== 'running') {
      audioCaption.textContent = 'Tap or press a key to start the birthday tune. Browsers may block sound until you interact.';
      return;
    }
    birthdayTune = createBirthdayTune();
    birthdayTune.start();
    playlistButton.setAttribute('aria-pressed', 'true');
    playlistButton.disabled = true;
    playlistLabel.textContent = 'Birthday tune is playing';
    audioCaption.textContent = 'A lively, original debut-party tune is playing on repeat.';
    document.removeEventListener('pointerdown', startTuneAfterInteraction);
    document.removeEventListener('keydown', startTuneAfterInteraction);
  } catch (error) {
    audioCaption.textContent = 'Tap or press a key to start the birthday tune.';
    if (showError) showToast('Audio playback isn’t available yet. Try again after interacting with the page.');
  } finally {
    tuneStarting = false;
  }
}
function startTuneAfterInteraction(event) {
  if (event.target.closest?.('#playlist-button')) return;
  startBirthdayTune();
}
document.addEventListener('pointerdown', startTuneAfterInteraction);
document.addEventListener('keydown', startTuneAfterInteraction);
playlistButton.addEventListener('click', () => {
  if (!birthdayTune) {
    startBirthdayTune(true);
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && audioContext?.state === 'suspended') {
    audioContext.resume().then(() => {
      if (audioContext.state === 'running' && birthdayTune) {
        audioCaption.textContent = 'A lively, original debut-party tune is playing on repeat.';
      }
    }).catch(() => {
      audioCaption.textContent = 'Tap or press a key to resume the birthday tune.';
    });
  }
});
startBirthdayTune();
