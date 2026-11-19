import React, { useEffect, useRef, useState } from 'react';

const recentSeed = [
  { title: 'Dreams', artist: 'Fleetwood Mac', note: 'From your last session', color: 'lavender' },
  { title: 'Golden', artist: 'Harry Styles', note: 'Yesterday', color: 'peach' },
  { title: 'Birds of a Feather', artist: 'Billie Eilish', note: 'Monday', color: 'mint' },
];

function Icon({ name, size = 20 }) {
  const paths = {
    note: <><path d="M8 18V6l10-2v12"/><circle cx="5.5" cy="18" r="3"/><circle cx="15.5" cy="16" r="3"/><path d="M18 8l3-1v8"/><circle cx="20" cy="17" r="2"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    mic: <><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/></>,
    arrow: <><path d="M5 12h14m-7-7 7 7-7 7"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-2-5.8L4 11l6-2.2L12 3Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></>,
    play: <path d="m8 5 12 7-12 7z" fill="currentColor" stroke="none"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

async function encodeWav(recording) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return new File([recording], 'hum.webm', { type: recording.type || 'audio/webm' });
  const context = new AudioContextClass();
  try {
    const decoded = await context.decodeAudioData(await recording.arrayBuffer());
    const channels = Math.min(decoded.numberOfChannels, 2);
    const frames = decoded.length;
    const dataSize = frames * channels * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const write = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
    write(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); write(8, 'WAVE'); write(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true);
    view.setUint32(24, decoded.sampleRate, true); view.setUint32(28, decoded.sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); write(36, 'data'); view.setUint32(40, dataSize, true);
    let offset = 44;
    for (let frame = 0; frame < frames; frame += 1) for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, decoded.getChannelData(channel)[frame]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true); offset += 2;
    }
    return new File([buffer], 'hum.wav', { type: 'audio/wav' });
  } finally { await context.close(); }
}

export default function Home() {
  const [mode, setMode] = useState('hum');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [providers, setProviders] = useState([]);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tune-detective-history') || '[]'); } catch { return []; }
  });
  const recorder = useRef(null);
  const chunks = useRef([]);
  const streamRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    const prompt = (event) => { event.preventDefault(); setInstallPrompt(event); };
    const installedHandler = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener('beforeinstallprompt', prompt);
    window.addEventListener('appinstalled', installedHandler);
    if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    fetch('/api/melody/providers').then((response) => response.json()).then((data) => setProviders(data.providers || [])).catch(() => {});
    return () => {
      window.removeEventListener('beforeinstallprompt', prompt);
      window.removeEventListener('appinstalled', installedHandler);
      clearInterval(timer.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => { localStorage.setItem('tune-detective-history', JSON.stringify(history.slice(0, 8))); }, [history]);

  const addHistory = (item) => setHistory((items) => [item, ...items.filter((old) => old.title !== item.title)].slice(0, 8));
  const startRecording = async () => {
    setMessage('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessage('Microphone recording is not available in this browser. Try Safari, Chrome, or Edge over HTTPS.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferred = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((type) => MediaRecorder.isTypeSupported(type));
      const mediaRecorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
      recorder.current = mediaRecorder;
      chunks.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const recording = new Blob(chunks.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (recording.size < 4000) { setMessage('That was a very short clip. Try humming for at least a few seconds.'); return; }
        setBusy(true);
        setMessage('Recording captured. Checking several recognition sources…');
        try {
          const clip = await encodeWav(recording);
          const form = new FormData();
          form.append('audio', clip, clip.name || 'hum.wav');
          const response = await fetch('/api/melody/identify', { method: 'POST', body: form });
          const result = await response.json();
          if (response.ok && result.matches?.length) {
            const match = result.matches[0];
            addHistory({ title: match.title || 'Unknown track', artist: match.artist || 'Unknown artist', note: 'Just now', color: 'lavender', url: match.links?.spotify });
            setMessage(`Possible match: ${match.title} by ${match.artist} · ${match.providers?.join(' + ') || match.provider}`);
          } else if (response.ok && result.suggestions?.length) {
            const suggestion = result.suggestions[0];
            const catalogNote = suggestion.catalogMatches?.length ? `Listed by ${suggestion.catalogMatches.join(' + ')}, but still unconfirmed against the audio.` : 'I couldn’t verify it in the music catalogs.';
            addHistory({ title: suggestion.title, artist: suggestion.artist, note: 'AI suggestion · unverified', color: 'lavender', url: suggestion.links?.spotify });
            setMessage(`Gemini suggests: ${suggestion.title} by ${suggestion.artist}. ${catalogNote}`);
          } else if (!response.ok && result.message) setMessage(result.message);
          else if (result.providers?.length) {
            setMessage(`No clear match yet. Checked ${result.providers.map((provider) => provider.name).join(', ')}. Try a longer or more recognizable part.`);
          } else if (result.message) setMessage(result.message);
        } catch { setMessage('Could not reach the matching server. Your recording was not uploaded.'); }
        finally { setBusy(false); setSeconds(0); }
      };
      mediaRecorder.start();
      setRecording(true);
      setSeconds(0);
      timer.current = setInterval(() => setSeconds((value) => value + 1), 1000);
    } catch (error) {
      setMessage(error.name === 'NotAllowedError' ? 'Microphone access was blocked. Allow access in your browser settings and try again.' : 'Could not start the microphone. Check that no other app is using it.');
    }
  };
  const stopRecording = () => {
    if (!recording) return;
    setRecording(false);
    clearInterval(timer.current);
    recorder.current?.stop();
  };

  const searchLyrics = async (event) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setBusy(true); setMessage('Searching songs…');
    try {
      const response = await fetch(`/api/lyrics/${encodeURIComponent(term)}`);
      const data = await response.json();
      const tracks = data.message?.body?.track_list || data.tracks || [];
      if (!tracks.length) setMessage(data.error || 'No matches found. Try a different lyric or title.');
      else {
        const track = tracks[0].track || tracks[0];
        const item = { title: track.track_name || track.title || 'Unknown track', artist: track.artist_name || track.artist || 'Unknown artist', note: 'Just now', color: 'peach', url: track.url, artwork: track.artwork };
        addHistory(item); setMessage(`Possible match: ${item.title} by ${item.artist} · ${track.sources?.join(' + ') || track.source || 'music catalogs'}`);
      }
    } catch { setMessage('Could not reach the song search service. Please try again later.'); }
    finally { setBusy(false); }
  };

  const installApp = async () => {
    if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); }
    else setMessage('To add Tune Detective on iPhone: open this page in Safari, tap Share, then “Add to Home Screen”.');
  };
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Tune Detective home"><span className="brand-mark"><Icon name="note" size={22}/></span><span>Tune <span className="brand-light">Detective</span></span></a>
        <div className="top-actions"><span className="availability"><i/> Listening for a hit</span><button className="install-button" onClick={installApp}>{installed ? 'App installed' : 'Get the app'} <Icon name="arrow" size={15}/></button></div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy"><div className="eyebrow"><span/> YOUR NEXT FAVOURITE IS ON THE TIP OF YOUR TONGUE</div><h1>Every tune<br/><span>has a trail</span></h1><p>Hum a little. We’ll help you uncover the song you can’t stop thinking about.</p><div className="trust-line"><span className="wave-icon">〰</span> No lyrics? No problem. Just you and the tune.</div></div>
          <div className={`listen-card ${recording ? 'is-recording' : ''}`}>
            <div className="card-top"><span className="card-label"><Icon name="spark" size={16}/> HUM TO SEARCH</span><span className="secure-label"><span/> PRIVATE BY DESIGN</span></div>
            <div className={`visualizer ${recording ? 'active' : ''}`} aria-hidden="true">{Array.from({ length: 41 }, (_, i) => <span key={i} style={{ '--bar': `${14 + Math.abs(Math.sin(i * 12.98)) * (recording ? 66 : 35)}%`, '--delay': `${(i % 11) * -0.09}s` }}/>)}</div>
            <div className="listen-status"><strong>{recording ? 'I’m listening…' : busy ? 'One moment…' : 'Ready when you are'}</strong><span>{recording ? `Humming time · ${time}` : 'Find a song by humming its melody'}</span></div>
            <button className={`record-button ${recording ? 'stop' : ''}`} disabled={busy} onClick={recording ? stopRecording : startRecording} aria-label={recording ? 'Stop recording' : 'Start humming'}>
              <span className="record-icon">{recording ? <span className="stop-square"/> : <Icon name="mic" size={21}/>}</span>{recording ? 'That’s it, find my song' : 'Tap to hum'}
            </button>
            <div className="record-hint">{recording ? 'A few seconds is all we need' : 'Hum or sing for a few seconds'}</div>
            <div className="privacy-note"><span className="privacy-lock">⌑</span> Mic switches off after recording. The clip is sent to enabled search services.</div>
            <div className="provider-line">AI + CATALOG CHECKS<span>{providers.filter((provider) => provider.configured).map((provider) => provider.name).join(' · ') || 'PROVIDERS SET UP SOON'}</span><em>AI ideas stay separate from catalog-confirmed matches.</em></div>
          </div>
          <div className="hero-stamp"><span>THE<br/>SOUNDTRACK<br/>TO YOUR<br/><b>THOUGHTS</b></span><i>✳</i></div>
        </section>

        <section className="discovery">
          <div className="section-heading"><div><div className="eyebrow small">A SECOND WAY IN</div><h2>Remember a little?</h2></div><span className="heading-note">Every clue counts.</span></div>
          <div className="search-panel"><div className="mode-tabs"><button className={mode === 'hum' ? 'selected' : ''} onClick={() => setMode('hum')}><Icon name="mic" size={16}/> Hum a melody</button><button className={mode === 'words' ? 'selected' : ''} onClick={() => setMode('words')}><Icon name="search" size={16}/> Search words</button></div>
            {mode === 'words' ? <form className="search-form" onSubmit={searchLyrics}><Icon name="search" size={19}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a lyric, song, or artist…" aria-label="Search lyrics, song, or artist"/><button type="submit" disabled={busy || !query.trim()} aria-label="Search"><Icon name="arrow" size={18}/></button></form> : <button className="secondary-hum" onClick={() => { document.querySelector('.listen-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}><span>Still have the tune in your head?</span><span className="secondary-cta">Go hum it <Icon name="arrow" size={15}/></span></button>}
            {message && <div className="feedback" role="status"><span className="feedback-dot"/>{message}<button aria-label="Dismiss message" onClick={() => setMessage('')}><Icon name="close" size={15}/></button></div>}
          </div>
        </section>

        <section className="recent"><div className="section-heading recent-head"><div><div className="eyebrow small">THE TRAIL SO FAR</div><h2>Recently uncovered</h2></div><button className="history-button" onClick={() => { setHistory([]); localStorage.removeItem('tune-detective-history'); }}>Clear history <Icon name="close" size={14}/></button></div>
          {history.length ? <div className="track-list">{history.map((track, i) => <div className="track-row" key={`${track.title}-${i}`}><div className={`album-art ${track.color || ['lavender', 'peach', 'mint'][i % 3]}`} style={track.artwork ? { backgroundImage: `url(${track.artwork})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}><Icon name="note" size={19}/><span>{String(i + 1).padStart(2, '0')}</span></div><div className="track-info"><strong>{track.title}</strong><span>{track.artist}</span></div><span className="track-date">{track.note}</span>{track.url ? <a className="play-button" href={track.url} target="_blank" rel="noreferrer" aria-label={`Open ${track.title} on Spotify`}><Icon name="arrow" size={14}/></a> : <button className="play-button" aria-label={`No streaming link for ${track.title}`} onClick={() => setMessage('This result did not include a streaming link.')}><Icon name="note" size={14}/></button>}</div>)}</div> : <div className="empty-history"><span><Icon name="clock" size={20}/></span><div><strong>Your discoveries will live here</strong><p>Every song you find is saved on this device.</p></div></div>}
        </section>
        <section className="how-it-works"><div className="how-title"><div className="eyebrow small">THREE LITTLE STEPS</div><h2>From “hmm” to <em>there it is.</em></h2></div><div className="steps"><div><span>01</span><strong>Hum the tune</strong><p>Give us the part you remember. Even a little is enough.</p></div><div><span>02</span><strong>We follow the melody</strong><p>We compare the shape of your tune against our song catalogue.</p></div><div><span>03</span><strong>Meet your earworm</strong><p>Get a possible match and pick up where the song left off.</p></div></div></section>
      </main>
      <footer><a className="brand footer-brand" href="#home"><span className="brand-mark"><Icon name="note" size={17}/></span><span>Tune <span className="brand-light">Detective</span></span></a><span>For the songs that got away.</span><button onClick={installApp}>{installed ? 'On your home screen ✓' : 'Take us with you ↗'}</button></footer>
    </div>
  );
}
