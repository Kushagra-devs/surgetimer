import { EventEmitter } from 'node:events';
import net from 'node:net';
import { ReadlineParser, SerialPort } from 'serialport';
import type {
  HardwareParserRule,
  HardwareStatus,
  ParsedTimingSignal,
  RawHardwareMessage,
} from '@horse-timer/types';

export interface TimingHardwareAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  onRawData(cb: (payload: RawHardwareMessage) => void): void;
  sendCommand?(command: string): Promise<void>;
  getStatus(): HardwareStatus;
}

export interface TimingMessageParser {
  canParse(payload: string): boolean;
  parse(payload: string): ParsedTimingSignal | null;
}

export class RegexTimingMessageParser implements TimingMessageParser {
  constructor(
    private readonly triggerPattern: RegExp,
    private readonly finishPattern: RegExp,
    private readonly sourceFilter: RawHardwareMessage['source'] | 'any' = 'any',
  ) {}

  canParse(payload: string): boolean {
    return this.triggerPattern.test(payload) || this.finishPattern.test(payload);
  }

  parse(payload: string): ParsedTimingSignal | null {
    const finishMatch = payload.match(this.finishPattern);
    if (finishMatch) {
      return {
        type: 'FINISH',
        channel: finishMatch.groups?.channel,
        hardwareTimestamp: finishMatch.groups?.timestamp,
        rawPayload: payload,
      };
    }

    const triggerMatch = payload.match(this.triggerPattern);
    if (triggerMatch) {
      return {
        type: 'TRIGGER',
        channel: triggerMatch.groups?.channel,
        hardwareTimestamp: triggerMatch.groups?.timestamp,
        rawPayload: payload,
      };
    }

    return null;
  }

  supportsSource(source: RawHardwareMessage['source']) {
    return this.sourceFilter === 'any' || this.sourceFilter === source;
  }
}

export class ParserPipeline {
  constructor(private readonly parsers: TimingMessageParser[]) {}

  parse(payload: string, source: RawHardwareMessage['source'] = 'tcp'): ParsedTimingSignal {
    for (const parser of this.parsers) {
      if (parser instanceof RegexTimingMessageParser && !parser.supportsSource(source)) {
        continue;
      }
      if (!parser.canParse(payload)) {
        continue;
      }
      const parsed = parser.parse(payload);
      if (parsed) {
        return parsed;
      }
    }

    return {
      type: 'UNKNOWN',
      rawPayload: payload,
    };
  }
}

export function buildParserPipelineFromRules(rules: HardwareParserRule[]) {
  const parsers = rules
    .filter((rule) => rule.enabled)
    .map((rule) => {
      const channelGroupName = rule.channelGroupName ?? 'channel';
      const timestampGroupName = rule.timestampGroupName ?? 'timestamp';
      const normalizedPattern = new RegExp(rule.pattern, 'i');

      if (rule.type === 'FINISH') {
        return new RegexTimingMessageParser(
          /$^/,
          normalizedPattern,
          rule.sourceFilter ?? 'any',
        );
      }

      return new RegexTimingMessageParser(
        normalizedPattern,
        /$^/,
        rule.sourceFilter ?? 'any',
      );
    });

  return new ParserPipeline(parsers);
}

abstract class BaseAdapter implements TimingHardwareAdapter {
  protected readonly emitter = new EventEmitter();
  protected connected = false;
  protected lastMessageAt?: string;

  onRawData(cb: (payload: RawHardwareMessage) => void): void {
    this.emitter.on('raw-data', cb);
  }

  isConnected(): boolean {
    return this.connected;
  }

  protected emit(message: RawHardwareMessage): void {
    this.lastMessageAt = message.receivedAt;
    this.emitter.emit('raw-data', message);
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract getStatus(): HardwareStatus;
}

export class MockTimingHardwareAdapter extends BaseAdapter {
  constructor(private readonly port = 'mock://local') {
    super();
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async inject(payload: string, channel = 'C0'): Promise<void> {
    if (!this.connected) {
      throw new Error('Mock adapter is not connected');
    }
    this.emit({
      source: 'tcp',
      port: this.port,
      payload: `${channel} ${payload}`,
      receivedAt: new Date().toISOString(),
    });
  }

  getStatus(): HardwareStatus {
    return {
      connected: this.connected,
      mode: 'mock',
      source: 'simulated',
      configuredForLiveTiming: false,
      details: this.port,
      lastMessageAt: this.lastMessageAt,
    };
  }
}

export class SerialTimingHardwareAdapter extends BaseAdapter {
  private serialPort: SerialPort | null = null;
  private parser: ReadlineParser | null = null;

  constructor(
    private readonly port: string,
    private readonly baudRate = 9600,
    private readonly lineDelimiter: '\n' | '\r\n' | '\r' = '\n',
  ) {
    super();
  }

  async connect(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.serialPort = new SerialPort({
        path: this.port,
        baudRate: this.baudRate,
        autoOpen: false,
      });

      this.serialPort.open((error) => {
        if (error) {
          reject(error);
          return;
        }

        this.connected = true;
        this.parser = this.serialPort!.pipe(new ReadlineParser({ delimiter: this.lineDelimiter }));
        this.parser.on('data', (line: string) => {
          const payload = line.trim();
          if (!payload) {
            return;
          }
          this.emit({
            source: 'usb-serial',
            port: this.port,
            payload,
            receivedAt: new Date().toISOString(),
          });
        });
        resolve();
      });

      this.serialPort.on('close', () => {
        this.connected = false;
      });

      this.serialPort.on('error', reject);
    });
  }

  async disconnect(): Promise<void> {
    if (this.parser) {
      this.parser.removeAllListeners();
      this.parser = null;
    }
    if (this.serialPort && this.serialPort.isOpen) {
      await new Promise<void>((resolve) => {
        this.serialPort?.close(() => resolve());
      });
    }
    this.serialPort = null;
    this.connected = false;
  }

  getStatus(): HardwareStatus {
    return {
      connected: this.connected,
      mode: 'serial',
      source: 'physical',
      configuredForLiveTiming: true,
      details: this.port,
      lastMessageAt: this.lastMessageAt,
    };
  }
}

export class TcpTimingHardwareAdapter extends BaseAdapter {
  private socket: net.Socket | null = null;
  private buffer = '';
  private readonly delimiter: string;

  constructor(
    private readonly host: string,
    private readonly port: number,
    lineDelimiter: 'LF' | 'CRLF' | 'CR' = 'LF',
  ) {
    super();
    this.delimiter = lineDelimiter === 'CRLF' ? '\r\n' : lineDelimiter === 'CR' ? '\r' : '\n';
  }

  async connect(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.socket = net.createConnection({ host: this.host, port: this.port }, () => {
        this.connected = true;
        resolve();
      });

      this.socket.on('data', (chunk) => {
        this.buffer += chunk.toString('utf8');
        const lines = this.buffer.split(this.delimiter);
        this.buffer = lines.pop() ?? '';
        for (const line of lines) {
          const payload = line.trim();
          if (!payload) {
            continue;
          }
          this.emit({
            source: 'tcp',
            port: `${this.host}:${this.port}`,
            payload,
            receivedAt: new Date().toISOString(),
          });
        }
      });

      this.socket.on('error', reject);
      this.socket.on('close', () => {
        this.connected = false;
      });
    });
  }

  async disconnect(): Promise<void> {
    if (!this.socket) {
      this.connected = false;
      return;
    }
    this.socket.destroy();
    this.socket = null;
    this.connected = false;
  }

  getStatus(): HardwareStatus {
    return {
      connected: this.connected,
      mode: 'tcp',
      source: 'physical',
      configuredForLiveTiming: true,
      details: `${this.host}:${this.port}`,
      lastMessageAt: this.lastMessageAt,
    };
  }
}
