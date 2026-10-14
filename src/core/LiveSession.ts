import type { BaseLang, Profile, Settings } from './types';
import { Emitter } from './storage';
import { pick } from './rng';
import { SettingsManager } from './settings/SettingsManager';
import { CameraManager } from './camera/CameraManager';
import { ViewerEngine, type ViewerConfig } from './viewers/ViewerEngine';
import { CommentEngine } from './comments/CommentEngine';
import type { CommentProvider } from './comments/CommentProvider';
import { LocalCommentProvider } from './comments/LocalCommentProvider';
import { getProfiles } from './comments/profiles';
import { ReactionEngine } from './reactions/ReactionEngine';
import { ScenarioManager } from './scenarios/ScenarioManager';
import { ScenarioPlayer, type PlayerStatus } from './scenarios/ScenarioPlayer';
import { parseScenarioScript, type ScenarioChatMode, type ScenarioEvent } from './scenarios/scenarioScript';

export interface SessionState {
  live: boolean;
  startedAt: number;
}

const viewerCfg = (s: Settings): ViewerConfig => ({
  initial: s.viewersInitial,
  min: s.viewersMin,
  max: s.viewersMax,
  speed: s.viewerSpeed,
  volatility: s.viewerVolatility,
});

/**
 * Связывает все модули эфира. UI работает только с этим объектом и не знает,
 * откуда берутся комментарии — локальный генератор или будущий AI.
 */
export class LiveSession extends Emitter {
  readonly settings = new SettingsManager();
  readonly camera = new CameraManager();
  readonly scenarios = new ScenarioManager();
  readonly reactions = new ReactionEngine();
  readonly viewers: ViewerEngine;
  readonly comments: CommentEngine;
  readonly player: ScenarioPlayer;

  private state: SessionState = { live: false, startedAt: 0 };
  private prevSettings: Settings;

  constructor(provider: CommentProvider = new LocalCommentProvider()) {
    super();
    const s = this.settings.getSnapshot();
    this.prevSettings = s;
    this.viewers = new ViewerEngine(viewerCfg(s));
    this.comments = new CommentEngine(provider, () => {
      const c = this.settings.getSnapshot();
      return { mode: c.chatMode, lang: c.lang, theme: c.theme, streamerName: c.streamerName, allowJoins: c.showJoins };
    });
    this.comments.setPaused(s.paused);
    this.reactions.setMode(s.chatMode);
    this.player = new ScenarioPlayer(this.applyEvent, this.onPlayerStatus);
    this.settings.subscribe(this.onSettings);
  }

  getSnapshot = (): SessionState => this.state;

  streamerProfile(): Profile {
    const s = this.settings.getSnapshot();
    return {
      id: 'streamer',
      username: s.streamerName,
      lang: 'ru',
      hue: 330,
      initials: (s.streamerName.replace(/[^\p{L}]/gu, '')[0] ?? 'Я').toUpperCase(),
      style: 0,
      image: s.streamerAvatar ?? undefined,
    };
  }

  start(): void {
    if (this.state.live) return;
    const s = this.settings.getSnapshot();
    void this.camera.start(s.facing);
    this.comments.clear();
    this.viewers.configure(viewerCfg(s), true);
    this.viewers.start();
    this.comments.start();
    this.reactions.setMode(s.chatMode);
    this.reactions.setEnabled(s.hearts);
    this.state = { live: true, startedAt: Date.now() };
    this.emit();
  }

  end(): void {
    this.player.stop();
    this.comments.stop();
    this.comments.clear();
    this.comments.setSuspended(false);
    this.comments.setModeOverride(null);
    this.viewers.stop();
    this.reactions.setEnabled(false);
    this.camera.stop();
    this.state = { live: false, startedAt: 0 };
    this.emit();
  }

  switchCamera(): void {
    const facing = this.settings.getSnapshot().facing === 'user' ? 'environment' : 'user';
    this.settings.update({ facing });
    if (this.state.live) void this.camera.start(facing);
  }

  sendOwn(text: string): void {
    const t = text.trim();
    if (t) this.comments.addOwn(t.slice(0, 200), this.streamerProfile());
  }

  /** Реплика от имени зрителя (ник можно не указывать — будет случайный). */
  sendScripted(username: string | undefined, text: string): void {
    const t = text.trim();
    if (!t) return;
    this.comments.addScripted(username?.trim().replace(/^@/, '') || undefined, t.slice(0, 200), () =>
      this.randomProfile(),
    );
  }

  playScenario(id: string): string[] {
    const sc = this.scenarios.get(id);
    if (!sc) return ['Сценарий не найден'];
    const { events, errors } = parseScenarioScript(sc.script);
    if (!events.length) return errors.length ? errors.map((e) => `Строка ${e.line}: ${e.message}`) : ['Сценарий пуст'];
    if (!this.state.live) this.start();
    this.viewers.rampTo(sc.initialViewers, 0);
    this.applyChatMode(sc.chatMode);
    this.player.play(sc.id, events, sc.speed);
    return [];
  }

  private randomProfile(): Profile {
    const lang = this.settings.getSnapshot().lang;
    const all = getProfiles();
    const base: BaseLang = lang === 'mix' ? pick<BaseLang>(['ru', 'uk', 'en']) : lang;
    return pick(all.filter((p) => p.lang === base));
  }

  private applyChatMode(mode: ScenarioChatMode): void {
    if (mode === 'off') {
      this.comments.setSuspended(true);
    } else {
      this.comments.setSuspended(false);
      this.comments.setModeOverride(mode);
      this.reactions.setMode(mode);
    }
  }

  private applyEvent = (e: ScenarioEvent): void => {
    switch (e.type) {
      case 'comment':
        this.sendScripted(e.username, e.text);
        break;
      case 'viewers':
        this.viewers.rampTo(e.to, e.durationMs);
        break;
      case 'chat':
        this.applyChatMode(e.mode);
        break;
      case 'hearts':
        this.reactions.burst(e.count);
        break;
    }
  };

  private onPlayerStatus = (status: PlayerStatus): void => {
    if (status === 'idle') {
      // Остановка сценария — возвращаем чат к пользовательским настройкам.
      this.comments.setSuspended(false);
      this.comments.setModeOverride(null);
      this.reactions.setMode(this.settings.getSnapshot().chatMode);
    }
  };

  private onSettings = (): void => {
    const s = this.settings.getSnapshot();
    const p = this.prevSettings;
    this.prevSettings = s;
    if (
      s.viewersInitial !== p.viewersInitial ||
      s.viewersMin !== p.viewersMin ||
      s.viewersMax !== p.viewersMax ||
      s.viewerSpeed !== p.viewerSpeed ||
      s.viewerVolatility !== p.viewerVolatility
    ) {
      this.viewers.configure(viewerCfg(s));
    }
    this.comments.setPaused(s.paused);
    if (this.player.getSnapshot().status === 'idle') this.reactions.setMode(s.chatMode);
    this.reactions.setEnabled(this.state.live && s.hearts);
  };
}
